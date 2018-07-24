export interface User {
  key?: string;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  picture?: File;
  picture_url?: string;
  password?: string;
  language: string;
  subtitles_styles?: string;
}
