/**
 * @description Some out of game handling
 * @author Jaenster
 */
import {Events} from "../Events";
import worker from "../../lib/worker";
import {GameLocations} from "../../enums";


export type LocationsName =
  'InGame'
  | 'None'
  | 'Lobby'
  | 'InLine'
  | 'LobbyChat'
  | 'CreateGame'
  | 'JoinGame'
  | 'Ladder'
  | 'Channel'
  | 'MainMenu'
  | 'Login'
  | 'LoginError'
  | 'UnableToConnect'
  | 'CharSelect'
  | 'RealmDown'
  | 'Disconnected'
  | 'NewChar'
  | 'CharacterSelectWait'
  | 'LostConnection'
  | 'Splash'
  | 'KeyInUse'
  | 'Difficulty'
  | 'MainMenuConnecting'
  | 'InvalidCDKey'
  | 'Connecting'
  | 'ServerDown'
  | 'PleaseWait'
  | 'GameExists'
  | 'Gateway'
  | 'GameDoesNotExist'
  | 'CharacterCreate'
  | 'CharacterCreateAlreadyExists'
  | 'AgreeToTerms'
  | 'CreateNewAccount'
  | 'PleaseRead'
  | 'RegisterEmail'
  | 'Credits'
  | 'Cinematics'
  | 'CharacterChangeRealm'
  | 'GameIsFull'
  | 'OtherMultiplayer'
  | 'TCPIP'
  | 'EnterIP'
  | 'CharacterSelectNoChars'
  | 'CharacterSelectChangeRealm'
  | 'CantConnectTCP';


type cb<S> = (this: S, location?: number, previous?: number,) => void;

interface LocationEvents extends Events {
  on<S = this>(key: LocationsName, handler: cb<S>): this

  once<S = this>(key: LocationsName, handler: cb<S>): this

  off<S = this>(key: LocationsName, handler: cb<S>): this

  emit<S = this>(key: LocationsName, location?: number, previous?: number): this

  on<S = this>(key: 'location', handler: cb<S>): this

  once<S = this>(key: 'location', handler: cb<S>): this

  off<S = this>(key: 'location', handler: cb<S>): this

  emit<S = this>(key: 'location', location?: number, previous?: number): this
}


class LocationEvents extends Events {
  tick = getTickCount();
  oldLocation?: number;

  constructor() {
    super();
    worker.runInBackground('outGame', () => {
      if (getTickCount() - this.tick < 300) {
        return true;
      }
      /*if (me.ingame) {
          this.oldLocation = undefined;
      }*/
      this.update();
      this.tick = getTickCount();
      return true;
    })
  }

  update() {
    let location = getLocation();
    if (location === null) {
      location = GameLocations.InGame;
    }

    if (this.oldLocation !== location) {
      console.log(GameLocations[location]);
      this.emit('location', location, this.oldLocation);
      this.emit(GameLocations[location] as LocationsName, location, this.oldLocation);
      this.oldLocation = location;
    }
  }
}

export default new LocationEvents();