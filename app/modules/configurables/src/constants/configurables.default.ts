/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  tagline?: string;
  brandColor: TBrandColor;
  slaThreshold?: number;
  checkInWindowStart?: string;
  checkInWindowEnd?: string;
  welcomeMessage?: string;
  footerText?: string;
  enableSopAccess?: boolean;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "PresenceHQ",
  logoUrl: "FILL_LOGO_URL_HERE",
  tagline: "Attendance & SOP Management",
  brandColor: {
    primary: "#4F46E5",
    secondary: "#6366F1",
    accent: "#818CF8",
  },
  slaThreshold: 80,         // fill it here — % attendance required for Valid
  checkInWindowStart: "08:00", // fill it here
  checkInWindowEnd: "10:00",   // fill it here
  welcomeMessage: "Welcome to PresenceHQ. Upload your face photo to check in for today.", // fill it here
  footerText: "PresenceHQ — HR Attendance & SOP Management", // fill it here
  enableSopAccess: true,    // fill it here
};
