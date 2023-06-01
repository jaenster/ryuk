/**
 * @description Some in game buttons
 * @author Jaenster
 */

function ControlProxy(target, key) {
  Object.defineProperty(target, key, {
    get(this: Control) {
      return this.control?.[key];
    }
  })
}

class Control {
  public readonly type: number;
  public readonly x: number;
  public readonly y: number;
  public readonly xsize: number;
  public readonly ysize: number;

  get control() {
    return getControl(this.type, this.x, this.y, this.xsize, this.ysize) || undefined;
  }

  click() {
    this.control?.click();
  }

  setText(text: string) {
    this.control?.setText(text);
  }

  getText(): string[] {
    return this.control?.getText() || [];
  }

  @ControlProxy state!: number;
  @ControlProxy password!: boolean;
  @ControlProxy cursorpos!: number;
  @ControlProxy selectstart!: number;
  @ControlProxy selectend!: number;
  @ControlProxy disabled!: number;

  constructor(type, x, y, xsize, ysize) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.xsize = xsize;
    this.ysize = ysize;
  }


  public static SinglePlayer = new Control(-1, 264, 324, 272, 35);
  public static BattleNet = new Control(-1, 264, 366, 272, 35);
  public static OtherMultiplayer = new Control(-1, 264, 433, 272, 35);
  public static Exit = new Control(-1, 33, 572, 128, 35);
  public static Username = new Control(1, 322, 342, 162, 19);
  public static Password = new Control(1, 322, 396, 162, 19);
  public static Login = new Control(-1, 264, 484, 272, 35);

  public static SinglePlayerNormal = new Control(-1, 264, 297, 272, 35);
  public static SinglePlayerNightmare = new Control(-1, 264, 340, 272, 35);
  public static SinglePlayerHell = new Control(-1, 264, 383, 272, 35);

  public static OpenBattleNet = new Control(-1, 264, 310, 272, 35);
  public static TcpIp = new Control(-1, 264, 350, 272, 35);
  public static TcpIpHost = new Control(-1, 265, 206, 272, 35);
  public static TcpIpJoin = new Control(-1, 265, 264, 272, 35);

  public static IPAdress = new Control(-1, 300, 268, -1, -1);
  public static IPAdressOk = new Control(-1, 421, 337, 96, 32);

  public static JoinGameWindow = new Control(6, 652, 469, 120, 20);
  public static JoinGamePass = new Control(1, 606, 148, 155, 20);
  public static JoinGameName = new Control(1, 432, 148, 155, 20);

  public static CreateGameWindow = new Control(6, 533, 469, 120, 20);
  public static GameName = new Control(1, 432, 162, 158, 20);
  public static GamePass = new Control(1, 432, 217, 158, 20);
  public static CharacterDifferenceButton = new Control(6, 431, 341, 15, 16);
  public static CharacterDifference = new Control(1, 657, 342, 27, 20);

  public static CreateGame = new Control(6, 594, 433, 172, 32);
  public static Normal = new Control(6, 430, 381, 16, 16);
  public static Nightmare = new Control(6, 555, 381, 16, 16);
  public static Hell = new Control(6, 698, 381, 16, 16);

  public static EnterChat = new Control(6, 27, 480, 120, 20);
  public static Char4 = new Control(4, 237, 457, 72, 93);
  public static CharSelectBack = new Control(6, 33, 572, 128, 35);

  public static LoginErrorText = new Control(4, 199, 377, 402, 140);
  public static OkCentered = new Control(6, 351, 337, 96, 32);
  public static HellSP = new Control(-1, 264, 383, 272, 35);
  public static NightmareSP = new Control(-1, 264, 340, 272, 35);
  public static NormalSP = new Control(-1, 264, 297, 272, 35);

  public static ErrorOk = new Control(6, 335, 412, 128, 35);
  public static UnableToConnectOk = new Control(6, 335, 450, 128, 35);

  public static inUseBy = new Control(4, 158, 310, 485, 40);
  public static cancelWait = new Control(6, 330, 416, 128, 35);

  public static CharsToSelect = new Control(4, 37, 178, 200, 92);
  public static CreateCharButton = new Control(6, 33, 528, 168, 60);
  public static CreateCharName = new Control(1, 318, 510, 157, 16);
  public static CreateCharXpac = new Control(6, 319, 540, 15, 16);
  public static CreateCharHardcore = new Control(6, 319, 560, 15, 16);
  public static CreateCharLadder = new Control(6, 319, 580, 15, 16);
  public static CreateCharOk = new Control(6, 627, 572, 128, 35);
  public static CreateCharAlreadyExistsCancel = new Control(6, 351, 337, 96, 32);
}

export = Control;