/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "slaThreshold",
      type: "number",
      required: false,
      label: "Attendance SLA Threshold (%)",
      min: 0,
      max: 100,
    },
    {
      fieldName: "checkInWindowStart",
      type: "string",
      required: false,
      label: "Check-In Window Start (e.g. 08:00)",
    },
    {
      fieldName: "checkInWindowEnd",
      type: "string",
      required: false,
      label: "Check-In Window End (e.g. 10:00)",
    },
    {
      fieldName: "welcomeMessage",
      type: "string",
      required: false,
      label: "Employee Welcome Message",
    },
    {
      fieldName: "footerText",
      type: "string",
      required: false,
      label: "Footer Text",
    },
    {
      fieldName: "enableSopAccess",
      type: "boolean",
      required: false,
      label: "Allow employees to view SOPs",
    },
  ],
};