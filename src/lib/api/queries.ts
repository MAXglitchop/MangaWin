import { gql } from "graphql-request";

/* ===== MANGA QUERIES ===== */

export const GET_MANGAS = gql`
  query GetMangas($condition: MangaConditionInput, $filter: MangaFilterInput, $orderBy: MangaOrderBy, $orderByType: SortOrder) {
    mangas(
      condition: $condition
      filter: $filter
      orderBy: $orderBy
      orderByType: $orderByType
    ) {
      nodes {
        id
        title
        artist
        author
        description
        genre
        status
        thumbnailUrl
        url
        inLibrary
        realUrl
        lastFetchedAt
        unreadCount
        downloadCount
        sourceId
        lastReadChapter {
          id
          name
          chapterNumber
          lastPageRead
          lastReadAt
        }
      }
      totalCount
    }
  }
`;

export const GET_MANGA = gql`
  query GetManga($id: Int!) {
    manga(id: $id) {
      id
      title
      artist
      author
      description
      genre
      status
      thumbnailUrl
      url
      inLibrary
      realUrl
      lastFetchedAt
      unreadCount
      downloadCount
      sourceId
      source {
        name
        lang
      }
      lastReadChapter {
        id
        name
        chapterNumber
        lastPageRead
        lastReadAt
      }
    }
  }
`;

/* ===== CHAPTER QUERIES ===== */

export const GET_CHAPTERS = gql`
  query GetChapters($mangaId: Int!) {
    chapters(condition: { mangaId: $mangaId }, orderBy: SOURCE_ORDER, orderByType: DESC) {
      nodes {
        id
        name
        url
        chapterNumber
        scanlator
        mangaId
        isRead
        isBookmarked
        isDownloaded
        lastPageRead
        lastReadAt
        pageCount
        uploadDate
        fetchedAt
        sourceOrder
        realUrl
      }
      totalCount
    }
  }
`;

export const FETCH_CHAPTERS = gql`
  mutation FetchChapters($mangaId: Int!) {
    fetchChapters(input: { mangaId: $mangaId }) {
      chapters {
        id
        name
        chapterNumber
        isRead
        isDownloaded
        pageCount
        uploadDate
        sourceOrder
      }
    }
  }
`;

export const FETCH_CHAPTER_PAGES = gql`
  mutation FetchChapterPages($chapterId: Int!) {
    fetchChapterPages(input: { chapterId: $chapterId }) {
      chapter {
        id
        pageCount
      }
    }
  }
`;

export const GET_DOWNLOADED_CHAPTERS = gql`
  query GetDownloadedChapters {
    chapters(condition: { isDownloaded: true }, orderBy: CHAPTER_NUMBER, orderByType: DESC) {
      nodes {
        id
        name
        chapterNumber
        sourceOrder
        isRead
        isDownloaded
        manga {
          id
          title
          thumbnailUrl
        }
      }
    }
  }
`;

export const GET_HISTORY = gql`
  query GetHistory {
    chapters(orderBy: LAST_READ_AT, orderByType: DESC, first: 100) {
      nodes {
        id
        name
        chapterNumber
        isRead
        lastPageRead
        lastReadAt
        sourceOrder
        pageCount
        manga {
          id
          title
          thumbnailUrl
        }
      }
    }
  }
`;

/* ===== LIBRARY QUERIES ===== */

export const GET_LIBRARY = gql`
  query GetLibrary {
    mangas(condition: { inLibrary: true }) {
      nodes {
        id
        title
        thumbnailUrl
        inLibrary
        unreadCount
        downloadCount
        sourceId
      }
      totalCount
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      nodes {
        id
        name
        default
        order
      }
      totalCount
    }
  }
`;

/* ===== SOURCE QUERIES ===== */

export const GET_SOURCES = gql`
  query GetSources {
    sources {
      nodes {
        id
        name
        lang
        iconUrl
        isNsfw
        supportsLatest
      }
    }
  }
`;

export const FETCH_SOURCE_MANGA = gql`
  mutation FetchSourceManga($source: LongString!, $query: String, $page: Int!, $type: FetchSourceMangaType!) {
    fetchSourceManga(
      input: { source: $source, query: $query, page: $page, type: $type }
    ) {
      mangas {
        id
        title
        thumbnailUrl
        author
        inLibrary
      }
      hasNextPage
    }
  }
`;

/* ===== EXTENSION QUERIES ===== */

export const GET_EXTENSIONS = gql`
  query GetExtensions {
    extensions {
      nodes {
        apkName
        hasUpdate
        iconUrl
        isInstalled
        isNsfw
        isObsolete
        lang
        name
        pkgName
        repo
        versionCode
        versionName
      }
    }
  }
`;

export const FETCH_EXTENSIONS = gql`
  mutation FetchExtensions {
    fetchExtensions(input: {}) {
      clientMutationId
    }
  }
`;

export const UPDATE_EXTENSION = gql`
  mutation UpdateExtension($pkgName: String!, $install: Boolean, $uninstall: Boolean, $update: Boolean) {
    updateExtension(input: { id: $pkgName, patch: { install: $install, uninstall: $uninstall, update: $update } }) {
      extension {
        pkgName
        isInstalled
      }
    }
  }
`;

/* ===== DOWNLOAD QUERIES ===== */

export const GET_DOWNLOAD_STATUS = gql`
  query GetDownloadStatus {
    downloadStatus {
      state
      queue {
        chapter {
          id
          name
          chapterNumber
          mangaId
        }
        manga {
          id
          title
          thumbnailUrl
        }
        progress
        state
        tries
      }
    }
  }
`;

export const ENQUEUE_CHAPTER_DOWNLOAD = gql`
  mutation EnqueueDownload($id: Int!) {
    enqueueChapterDownload(input: { id: $id }) {
      clientMutationId
      downloadStatus {
        state
        queue {
          chapter {
            id
            name
          }
          progress
          state
        }
      }
    }
  }
`;

export const DELETE_DOWNLOADED_CHAPTER = gql`
  mutation DeleteDownloadedChapter($id: Int!) {
    deleteDownloadedChapter(input: { id: $id }) {
      clientMutationId
    }
  }
`;

export const CLEAR_DOWNLOADER = gql`
  mutation ClearDownloader {
    clearDownloader(input: {}) {
      clientMutationId
    }
  }
`;

/* ===== MUTATION: UPDATE CHAPTERS ===== */

export const UPDATE_CHAPTER = gql`
  mutation UpdateChapter($id: Int!, $isRead: Boolean, $isBookmarked: Boolean, $lastPageRead: Int) {
    updateChapter(
      input: { id: $id, patch: { isRead: $isRead, isBookmarked: $isBookmarked, lastPageRead: $lastPageRead } }
    ) {
      chapter {
        id
        isRead
        isBookmarked
        lastPageRead
      }
    }
  }
`;

/* ===== MUTATION: LIBRARY ===== */

export const UPDATE_MANGA = gql`
  mutation UpdateManga($id: Int!, $inLibrary: Boolean) {
    updateManga(input: { id: $id, patch: { inLibrary: $inLibrary } }) {
      manga {
        id
        inLibrary
      }
    }
  }
`;

/* ===== SERVER INFO ===== */

export const GET_SERVER_INFO = gql`
  query GetServerInfo {
    aboutServer {
      name
      version
      buildType
      buildTime
      github
      discord
      revision
    }
  }
`;

/* ===== SETTINGS QUERIES ===== */

export const GET_SETTINGS = gql`
  query GetSettings {
    settings {
      extensionRepos
      globalUpdateInterval
    }
  }
`;

export const SET_SETTINGS = gql`
  mutation SetSettings($input: SetSettingsInput!) {
    setSettings(input: $input) {
      settings {
        extensionRepos
        globalUpdateInterval
      }
    }
  }
`;

export const GET_SOURCE_PREFERENCES = gql`
  query GetSourcePreferences($sourceId: LongString!) {
    source(id: $sourceId) {
      id
      name
      lang
      isNsfw
      iconUrl
      extension {
        versionName
        versionCode
      }
      preferences {
        __typename
        ... on ListPreference {
          key
          title
          summary
          listCurrentValue: currentValue
          listDefault: default
          entries
          entryValues
        }
        ... on SwitchPreference {
          key
          title
          summary
          switchCurrentValue: currentValue
          switchDefault: default
        }
        ... on CheckBoxPreference {
          key
          title
          summary
          checkCurrentValue: currentValue
          checkDefault: default
        }
        ... on EditTextPreference {
          key
          title
          summary
          textCurrentValue: currentValue
          textDefault: default
          dialogTitle
          dialogMessage
        }
        ... on MultiSelectListPreference {
          key
          title
          summary
          multiCurrentValue: currentValue
          multiDefault: default
          entries
          entryValues
          dialogTitle
          dialogMessage
        }
      }
    }
  }
`;

export const UPDATE_SOURCE_PREFERENCE = gql`
  mutation UpdateSourcePreference($sourceId: LongString!, $change: SourcePreferenceChangeInput!) {
    updateSourcePreference(input: { source: $sourceId, change: $change }) {
      clientMutationId
    }
  }
`;
