import { LucideIcon } from "lucide-react";

export interface Facility {
  id: string;
  titleKey: string;       // Key for translated title
  descriptionKey: string; // Key for translated description
  iconName: string;       // Reference name for lucide icon
}
