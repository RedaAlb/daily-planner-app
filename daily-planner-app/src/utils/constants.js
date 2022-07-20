// Views path
export const SETTINGS_VIEW_PATH = "/settings";


// Colours
export const MAIN_COLOUR = "#af8d67";
export const DATEPICKER_DOT_COLOUR = "#00c182";
export const SETTINGS_TOPBAR_BG = "#ffffff";


// Heights
export const TOPBAR_HEIGHT = "70px";
export const TOPBAR_LINE_HEIGHT = "2px";
export const MAIN_LINE_HEIGHT = "1px";
export const TASK_ITEM_MIN_HEIGHT = "30px";
export const SETTING_ITEM_HEIGHT = "64px";


// Gaps
export const DEFAULT_VERT_GAP = "30px";  // VERT: vertical
export const DEFAULT_HORI_GAP = "15px"   // HORI: horizontal


// Quantities
export const NUM_DAILY_BIG_ITEMS = 3;
export const NUM_TASK_ITEMS = 12;


// Font sizes
export const PRIMARY_FONT_SIZE = "18px";
export const SECONDARY_FONT_SIZE = "16px";


// State objects
export const ROUTINE_OBJ = {
  checked: false
}
export const DAILY_BIG_OBJ = {
  checked: false,
  text: ""
}
export const TASK_OBJ = {
  checked: false,
  text: ""
}


// State defaults
export const DEFAULT_DATE = new Date();
export const DEFAULT_TIME = "";
export const DEFAULT_ROUTINES = Array(3).fill(ROUTINE_OBJ);
export const DEFAULT_DAILY_BIGS = Array(NUM_DAILY_BIG_ITEMS).fill(DAILY_BIG_OBJ);
export const DEFAULT_TASKS = Array(NUM_TASK_ITEMS).fill(TASK_OBJ);
export const DEFAULT_NOTES = "";
export const DEFAULT_DATE_KEYS = [];


export const INITIAL_STATE = {
  currentDate: DEFAULT_DATE,
  time: DEFAULT_TIME,
  routines: DEFAULT_ROUTINES,
  dailyBigs: DEFAULT_DAILY_BIGS,
  tasks: DEFAULT_TASKS,
  notes: DEFAULT_NOTES,
  dateKeys: DEFAULT_DATE_KEYS,
}


// Firebase database
export const ROUTINES_PATH = "routines";
export const DAILYBIGS_PATH = "dailyBigs";
export const TASKS_PATH = "tasks";
export const NOTES_PATH = "notes";
export const TIME_PATH = "time";
export const DATE_KEYS_PATH = "dateKeys";
export const LOCATION_PATH = "location";


// Capacitor storage
export const DATE_SAVE_LOCATION = "DATE_SAVE_LOCATION";