// Surgery steps configuration
export const SURGERY_STEPS = [
  { id: "incisions", label: "פתחים" },
  { id: "capsulorhexis", label: "רקסיס" },
  { id: "hydrodissection", label: "הידרודיסקציה" },
  { id: "phacoemulsification", label: "פאקואמולסיפיקציה" },
  { id: "cortex_aspiration", label: "שאיבת קורטקס" },
  { id: "iol_insertion", label: "השתלת עדשה" },
  { id: "hydration", label: "הידרציה של פתחים" },
  { id: "toric_iol", label: "השתלת עדשה טורית" },
  { id: "solo", label: "סולו" },
];

export const COMPLEX_TYPES = [
  'הרחבת אישון',
  'ירוד בשל',
  'עין שקועה',
  'לשכה קדמית רדודה',
];

export const COMPLICATIONS_LIST = [
  'קרע בקופסית קדמית',
  'קרע בקופסית אחורית',
  'זונוליזיס',
  'ויטרקטומיה קדמית',
  'השתלת עדשה בסולקוס',
];

export const PHACO_LASER_STEPS = [
  { id: "laser_incisions", label: "פתחים" },
  { id: "laser_hydrodissection", label: "הידרודיסקציה" },
  { id: "laser_phacoemulsification", label: "פאקואמולסיפיקציה" },
  { id: "laser_cortex_aspiration", label: "שאיבת קורטקס" },
  { id: "laser_toric_iol", label: "השתלת עדשה טורית" },
  { id: "laser_hydration", label: "הידרציה של פתחים" },
];

export function getStepLabel(stepId) {
  return SURGERY_STEPS.find(s => s.id === stepId)?.label
    || PHACO_LASER_STEPS.find(s => s.id === stepId)?.label
    || stepId;
}