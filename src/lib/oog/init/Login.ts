import settings from "../../../settings/settings";
import LocationEvents, {LocationsName} from "../LocationEvents";
import Control from '../Control';
import sdk from "../../../sdk";
import CharData from '../../CharData'
import {GameLocations} from "../../../enums";

const CLASSIC = 1 << 0,
  XPAC = 1 << 1,
  SOFTCORE = 1 << 2,
  HARDCORE = 1 << 3,
  EUROPE = 1 << 4,
  USEAST = 1 << 5,
  USWEST = 1 << 6,
  ASIA = 1 << 7;


export function waitForLocation(loc: LocationsName | LocationsName[], timeout: number = 60e3): Promise<number> {
  return new Promise((resolve, reject) => {
    const locs = Array.isArray(loc) ? loc : [loc];
    let currentLoc = getLocation();
    if (locs.includes(sdk.locations[currentLoc] as LocationsName)) return resolve(currentLoc);
    console.log('Waiting for location -- ' + loc);
    //@ts-ignore -- There is a setTimeout in this env
    const timer = setTimeout(() => {
        reject('Timed out waiting for location (' + loc + ')');
        locs.forEach(loc => LocationEvents.off(loc, handler));
      }, timeout),
      handler = (location) => {
        // @ts-ignore
        clearTimeout(timer)
        resolve(location);
      };
    locs.forEach(loc => LocationEvents.once(loc, handler));
  })
}

export async function ToMainMenu() {
  //ToDo; other places where it can be but just splash lol
  switch (getLocation()) {
    case GameLocations.None:
    case GameLocations.Splash:
      sendKey(32); // space to shorten splash screen
      await waitForLocation("MainMenu");
      break;
  }
}

export async function ToBnet(set: typeof settings = settings) {
  if (getLocation() !== GameLocations.MainMenu) await ToMainMenu();

  // Old functionality, is sync
  ControlAction.clickRealm(set.getRealmNumber());


  Control.BattleNet.click();

  const location = await waitForLocation(['LoginError', 'Login', 'UnableToConnect'], 6e4);
  if (location === GameLocations.LoginError) await handleLoginError();
  if (location === GameLocations.UnableToConnect) {
    Control.UnableToConnectOk.click();
    ControlAction.timeoutDelay("Unable to Connect", StarterConfig.UnableToConnectDelay * 6e4);
  }
  return location !== GameLocations.Login;

}

export async function handleLoginError() {
  const text = Control.LoginErrorText.getText();
  if (text) {
    const switchKeys = function () {
      if (RyukStarter.gameInfo.switchKeys) {
        ControlAction.timeoutDelay("Key switch delay", StarterConfig.SwitchKeyDelay * 1000);
        D2Bot.restart(true);
      } else {
        D2Bot.stop(undefined, true);
      }
    }
    const issues: { locale: number, issue: string, action?(): void, color?: number }[] = [
      {locale: 5207, issue: 'Invalid Password'},
      {locale: 5208, issue: 'Invalid Account'},
      {locale: 5347, issue: "Disconnected"},
      ...[
        ...[5202, 10915].map(el => ({locale: el, issue: 'Invalid CDKey'})),
        {locale: 5199, issue: 'Disabled CDKey'},
        {locale: 10913, issue: 'Disabled LoD CDKey'},
      ].map(el => ({
        ...el,
        color: 6,
        action() {
          D2Bot.CDKeyDisabled();
          switchKeys();
        }
      })),
    ];

    let string = text.join(' ');
    const issue = issues.find(({locale}) => string === getLocaleString(locale)) || {
      issue: 'Login Error',
      color: 6,
      action: switchKeys,
    }
    if (issue) {
      D2Bot.updateStatus(issue.issue);
      D2Bot.printToConsole(issue.issue, issue?.color);
    }
  }

  Control.ErrorOk.click();
}

export async function ToSingleSelect() {
  await ToMainMenu();
  Control.SinglePlayer.click();
  await waitForLocation('CharSelect');
}

export async function LoginAccount() {
  if (getLocation() !== GameLocations.Login) await ToBnet();

  Control.Username.setText(settings.username);
  Control.Password.setText(settings.password);
  Control.Login.click();

  const location = await waitForLocation(['RealmDown', 'CharSelect']);
  if (location === GameLocations.RealmDown) {

  }
}

export async function getCharOnList(char: string, attempt: number = 1) {
  for (let i = 0; i < attempt; i += 1) {
    let control = Control.CharsToSelect.control
    while (control) {
      const text = (control.getText() || []);
      console.log(text);
      if (text && text.length > 1 && text[1].toLowerCase() === char.toLowerCase()) {
        return control;
      }
      control = control.getNext();
    }
  }
  return false;
}

export async function SelectChar(char: string) {
  const control = await getCharOnList(char)
  if (!control) throw new Error('Failed to find char');
  control.click();
  control.click(); // double click is selecting

  await waitForLocation(['Lobby', 'Difficulty', 'InGame']);
  switch (getLocation()) {
    case null:
      break;
    case sdk.locations.Difficulty:
      console.log('Selecting dificulty');

      // ToDo  Have more logic as this
      if (CharData.me.charlvl < 43) {
        console.log('Clicking normal');
        Control.NormalSP.click();
      } else if (CharData.me.charlvl < 70) {
        console.log('Clicking nightmare');
        Control.NightmareSP.click();
      } else {
        console.log('Clicking hell');
        Control.HellSP.click()
      }

      D2Bot.updateRuns();
      break;
  }
}

export async function CreateChar(char: string, mode: number = settings.mode) {
  switch (getLocation()) {
    case GameLocations.CharSelect:
    case GameLocations.CharacterSelectNoChars: {
      if (Control.CreateCharButton.disabled === 4) {
        throw new Error('Cannot create more chars');
      }
      Control.CreateCharButton.click();

      await waitForLocation('CharacterCreate');
      //@ts-ignore -- click on sorc
      getControl().click(620, 270);

      await waitForLocation('NewChar');
      Control.CreateCharName.setText(char);

      if (mode & CLASSIC) {
        Control.CreateCharXpac.click(); // by default on, this unactivates it
      }

      if (mode & HARDCORE) {
        Control.CreateCharHardcore.click();
      }

      Control.CreateCharOk.click();
    }
  }
}

export async function Login(attempts = 0) {

  me.blockMouse = true;

  await ToMainMenu();

  console.log(settings);
  const mode = settings.mode;

  const isOnline = !!(mode & (EUROPE | USEAST | USWEST | ASIA));

  if (isOnline) {
    console.log('is online');
    await ToBnet();
    await LoginAccount();
  } else {
    console.log('is single player');
    await ToSingleSelect();
  }

  try {
    await SelectChar(settings.charName);
  } catch (e) {
    console.error("Unable to select char " + settings.charName + " : " + e);
    await CreateChar(settings.charName, settings.mode);

    if (getLocation() === GameLocations.CharacterCreateAlreadyExists) {
      if (attempts > 2) {
        console.warn("Something is wrong with char select, too many attempts");
        D2Bot.restart();
      }
      Control.CreateCharAlreadyExistsCancel.click();
      Control.CharSelectBack.click();
      Login(attempts + 1);
    }
  }

  me.blockMouse = false;
}

RyukStarter.on('init', () => {
  LocationEvents.on('MainMenu', () => {
    Login();
  });

  ToMainMenu();
  // load('libs/Ryuk/lib/oog/Splits.js');
});
