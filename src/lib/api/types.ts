/* ===== Shared Types for Suwayomi GraphQL API ===== */

export interface MangaType {
  id: number;
  title: string;
  artist: string | null;
  author: string | null;
  description: string | null;
  genre: string[];
  status: string;
  thumbnailUrl: string | null;
  url: string;
  inLibrary: boolean;
  realUrl: string | null;
  lastFetchedAt: string;
  unreadCount: number;
  downloadCount: number;
  lastReadChapter: ChapterType | null;
  sourceId: string;
  source?: {
    name: string;
    lang: string;
  };
  categories?: {
    nodes: {
      id: number;
      name: string;
    }[];
  };
}

export interface ChapterType {
  id: number;
  name: string;
  url: string;
  chapterNumber: number;
  scanlator: string | null;
  mangaId: number;
  isRead: boolean;
  isBookmarked: boolean;
  isDownloaded: boolean;
  lastPageRead: number;
  lastReadAt: string;
  pageCount: number;
  uploadDate: string;
  fetchedAt: string;
  sourceOrder: number;
  realUrl: string | null;
  manga?: MangaType;
}

export interface CategoryType {
  id: number;
  name: string;
  default: boolean;
  order: number;
}

export interface SourceType {
  id: string;
  name: string;
  lang: string;
  iconUrl: string;
  isNsfw: boolean;
  supportsLatest: boolean;
}

export interface ExtensionType {
  apkName: string;
  hasUpdate: boolean;
  iconUrl: string;
  isInstalled: boolean;
  isNsfw: boolean;
  isObsolete: boolean;
  lang: string;
  name: string;
  pkgName: string;
  repo: string | null;
  versionCode: number;
  versionName: string;
}

export interface DownloadType {
  chapter: ChapterType;
  manga: MangaType;
  progress: number;
  state: "QUEUED" | "DOWNLOADING" | "FINISHED" | "ERROR";
  tries: number;
}

export interface DownloadStatus {
  state: "STARTED" | "STOPPED";
  queue: DownloadType[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface NodeList<T> {
  nodes: T[];
  totalCount: number;
  pageInfo: PageInfo;
}

export type PreferenceType = 
  | "ListPreference"
  | "SwitchPreference"
  | "CheckBoxPreference"
  | "EditTextPreference"
  | "MultiSelectListPreference";

export interface BasePreference {
  __typename: PreferenceType;
  key: string;
  title: string;
  summary: string;
}

export interface ListPreference extends BasePreference {
  __typename: "ListPreference";
  currentValue: string;
  default: string;
  entries: string[];
  entryValues: string[];
}

export interface SwitchPreference extends BasePreference {
  __typename: "SwitchPreference";
  currentValue: boolean;
  default: boolean;
}

export interface CheckBoxPreference extends BasePreference {
  __typename: "CheckBoxPreference";
  currentValue: boolean;
  default: boolean;
}

export interface EditTextPreference extends BasePreference {
  __typename: "EditTextPreference";
  currentValue: string;
  default: string;
  dialogTitle: string;
  dialogMessage: string;
}

export interface MultiSelectListPreference extends BasePreference {
  __typename: "MultiSelectListPreference";
  currentValue: string[];
  default: string[];
  entries: string[];
  entryValues: string[];
  dialogTitle: string;
  dialogMessage: string;
}

export type Preference = 
  | ListPreference
  | SwitchPreference
  | CheckBoxPreference
  | EditTextPreference
  | MultiSelectListPreference;

export interface SourceWithPreferencesType extends SourceType {
  version: string;
  extension?: {
    versionName: string;
    versionCode: number;
  };
  preferences: Preference[];
}
