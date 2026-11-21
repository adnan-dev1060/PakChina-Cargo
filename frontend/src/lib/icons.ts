import {
  BatteryCharging,
  Box,
  Building2,
  Cpu,
  Eye,
  FileCheck2,
  HandHeart,
  MapPin,
  MessageSquare,
  MessagesSquare,
  Package,
  PackageCheck,
  Plane,
  Route,
  SearchCheck,
  ShieldCheck,
  Ship,
  Smartphone,
  Stethoscope,
  Truck,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons the admin can choose from (stored by key in the database).
 * Add an entry here to make a new icon available in the dashboard.
 */
export const ICONS: Record<string, LucideIcon> = {
  ship: Ship,
  plane: Plane,
  truck: Truck,
  "file-check": FileCheck2,
  "package-check": PackageCheck,
  package: Package,
  warehouse: Warehouse,
  "search-check": SearchCheck,
  smartphone: Smartphone,
  cpu: Cpu,
  "battery-charging": BatteryCharging,
  stethoscope: Stethoscope,
  "message-square": MessageSquare,
  "messages-square": MessagesSquare,
  "map-pin": MapPin,
  route: Route,
  "building-2": Building2,
  "shield-check": ShieldCheck,
  eye: Eye,
  "hand-heart": HandHeart,
  zap: Zap,
  box: Box,
};

export const ICON_KEYS = Object.keys(ICONS);

export function getIcon(key: string | undefined): LucideIcon {
  return (key && ICONS[key]) || Box;
}
