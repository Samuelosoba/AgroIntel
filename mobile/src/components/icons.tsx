// One icon set for the whole app (Lucide line icons). Use <Icon name="…" />.
import {
  Activity, ArrowLeft, ArrowRight, BadgeCheck, Bell, Calendar, CalendarClock, Camera, CameraOff, ChartColumn, Check, ChevronLeft,
  ChevronRight, CircleAlert, CircleCheck, CircleHelp, Clock, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets,
  Eye, Focus, Hand, HeartPulse, Images, Info, Layers, Leaf, LocateFixed, LogOut, Map, MapPin, MessageCircle, Moon, Play, Plus, ScanLine,
  SendHorizontal, ShieldCheck, Sparkles, Sprout, Stethoscope, Sun, Sunrise, Sunset, Thermometer, ThumbsDown, ThumbsUp, Trash2, TriangleAlert,
  Umbrella, UserRoundSearch, Wheat, Wind, X, House,
} from "lucide-react-native";
import type { ColorValue } from "react-native";

const ICONS = {
  activity: Activity, "arrow-left": ArrowLeft, "arrow-right": ArrowRight, verified: BadgeCheck, bell: Bell, calendar: Calendar,
  "calendar-clock": CalendarClock, camera: Camera, "camera-off": CameraOff, chart: ChartColumn, check: Check, "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight, alert: CircleAlert, "check-circle": CircleCheck, help: CircleHelp, clock: Clock, cloud: Cloud,
  drizzle: CloudDrizzle, fog: CloudFog, storm: CloudLightning, rain: CloudRain, "cloud-sun": CloudSun, droplets: Droplets, eye: Eye,
  focus: Focus, hand: Hand, health: HeartPulse, images: Images, info: Info, layers: Layers, leaf: Leaf, locate: LocateFixed,
  logout: LogOut, map: Map, pin: MapPin, chat: MessageCircle, moon: Moon, play: Play, plus: Plus, scan: ScanLine, send: SendHorizontal,
  shield: ShieldCheck, sparkles: Sparkles, sprout: Sprout, treat: Stethoscope, sun: Sun, sunrise: Sunrise, sunset: Sunset,
  thermometer: Thermometer, "thumbs-down": ThumbsDown, "thumbs-up": ThumbsUp, trash: Trash2, warning: TriangleAlert, umbrella: Umbrella,
  expert: UserRoundSearch, wheat: Wheat, wind: Wind, close: X, home: House,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color, strokeWidth = 2 }: { name: IconName; size?: number; color?: ColorValue; strokeWidth?: number }) {
  const Component = ICONS[name];
  return <Component size={size} color={color as string} strokeWidth={strokeWidth} />;
}

/** Weather condition text (from the API) → icon. */
export function conditionIcon(condition: string): IconName {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return "storm";
  if (c.includes("drizzle")) return "drizzle";
  if (c.includes("rain")) return "rain";
  if (c.includes("fog")) return "fog";
  if (c.includes("clear")) return "sun";
  if (c.includes("partly")) return "cloud-sun";
  return "cloud";
}
