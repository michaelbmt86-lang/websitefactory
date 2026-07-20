export interface DashboardField {
    label: string;
    key: string;
    type: "text" | "textarea" | "image" | "video" | "email";
  }
  
  export interface DashboardSection {
    name: string;
    table: string;
    api: string;
    fields: DashboardField[];
  }
  
  export const DASHBOARD_SCHEMA: DashboardSection[] = [
  
    {
      name: "Header",
      table: "navigation",
      api: "/api/navigation",
  
      fields: [
        {
          label: "Navigation Items",
          key: "navigation",
          type: "textarea",
        },
        {
          label: "Contact Email",
          key: "email",
          type: "email",
        },
      ],
    },
  
    {
      name: "Hero",
      table: "hero",
      api: "/api/hero",
  
      fields: [
        {
          label: "Title Line 1",
          key: "title1",
          type: "text",
        },
        {
          label: "Title Line 2",
          key: "title2",
          type: "text",
        },
        {
          label: "Title Line 3",
          key: "title3",
          type: "text",
        },
        {
          label: "Video",
          key: "video",
          type: "video",
        },
        {
          label: "Poster",
          key: "poster",
          type: "image",
        },
      ],
    },
  
    {
      name: "Technology",
      table: "benefits",
      api: "/api/benefits",
  
      fields: [
        {
          label: "Benefits",
          key: "benefits",
          type: "textarea",
        },
      ],
    },
  
    {
      name: "Team",
      table: "team_members",
      api: "/api/team",
  
      fields: [
        {
          label: "Members",
          key: "team",
          type: "textarea",
        },
      ],
    },
  
    {
      name: "Footer",
      table: "footer",
      api: "/api/footer",
  
      fields: [
        {
          label: "Address",
          key: "address",
          type: "textarea",
        },
        {
          label: "Email",
          key: "email",
          type: "email",
        },
        {
          label: "Copyright",
          key: "copyright",
          type: "text",
        },
      ],
    },
  
  ];