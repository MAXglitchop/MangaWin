!macro NSIS_HOOK_POSTUNINSTALL
  MessageBox MB_YESNO "Do you want to delete all downloaded manga, settings, and reading history?" IDNO skip_delete
  RMDir /r "$LOCALAPPDATA\Tachidesk"
  RMDir /r "$APPDATA\MangaWin"
  skip_delete:
!macroend
