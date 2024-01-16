export interface ISettings {
  app_name?: { value: string; order: number }[];
  external_item_name?: { value: string; order: number }[];
  external_group_id?: { value: string; order: number }[];
  external_group_name?: { value: string; order: number }[];
  default_project_code?: { value: string; order: number }[];
  default_project_name?: { value: string; order: number }[];
}
