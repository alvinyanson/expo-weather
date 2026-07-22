import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  en: {
    // CurrentWeather
    todayPrefix: 'Today, ',

    // DailyForecastList
    forecastTitle: '8-Day Forecast',
    forecastMax: 'Max',
    forecastMin: 'Min',

    // DetailsHeader
    updatedPrefix: 'Updated %{time}',
    saveLocationLabel: 'Save location',
    shareLabel: 'Share weather',
    shareDialogTitle: 'Share weather',
    shareMessage:
      '%{city}: %{condition}, %{temp}%{unit} now (high %{high}%{unit}, low %{low}%{unit}).',
    shareFailedTitle: 'Share failed',
    shareFailedBody: 'Could not share the weather. Please try again.',

    // Copy coordinates
    copyCoordinatesHint: 'Long press to copy coordinates',
    coordinatesCopiedTitle: 'Coordinates copied',
    copyFailedTitle: 'Copy failed',
    copyFailedBody: 'Could not copy the coordinates. Please try again.',

    // HourlyForecast
    hourlySummary:
      '%{condition} conditions will continue for the rest of the day. Wind gusts are up to %{windSpeed} %{windUnit}.',
    nowText: 'Now',

    // OfflineIndicator
    offlineText: 'Offline. Displaying cached data.',

    // SavedLocationItem
    deleteLabel: 'Delete',
    deleteAccessLabel: 'Delete %{city}',
    savedPrefix: 'Saved %{savedAt}',

    // SearchHeader
    searchPlaceholder: 'Search city...',
    savedLocationsLabel: 'Saved locations',
    recentSearchesTitle: 'Recent Searches',

    // Map
    mapButtonLabel: 'Weather map',
    mapTitle: 'Weather Map',
    mapEmptyTitle: 'Nothing to show on the map yet.',
    mapEmptySubtitle: 'Enable location or save a location to see it on the map.',
    mapViewDetailsLabel: 'View details',
    mapZoomInLabel: 'Zoom in',
    mapZoomOutLabel: 'Zoom out',
    mapPickResolving: 'Resolving location…',
    mapPickHint: 'Long press anywhere on the map to inspect weather.',
    pickedSaveLabel: 'Save location',
    pickedUnsaveLabel: 'Unsave location',
    pickedDismissLabel: 'Dismiss marker',
    pickedViewDetailsLabel: 'View details',

    // WeatherSummaryCard
    humidityLabel: 'Humidity',
    windLabel: 'Wind',
    uvIndexLabel: 'UV Index',

    // Pressure
    pressureCardTitle: 'Atmospheric Pressure',
    pressureSensorLabel: 'Device',
    pressureForecastLabel: 'Forecast',
    pressureUnit: 'hPa',
    pressureChecking: 'Checking sensor...',
    pressureUnavailable: 'No barometer on this device.',
    pressureMatchesForecast: 'Matches the forecast.',
    pressureAboveForecast: '%{delta} hPa above forecast',
    pressureBelowForecast: '%{delta} hPa below forecast',

    // login
    appName: 'Expo Weather',
    loginSubtitle: 'Sign in to continue',
    continueGoogle: 'Continue with Google',
    continueGuest: 'Continue as Guest',
    googleFail: 'Google sign-in failed',
    guestFail: 'Guest sign-in failed',

    // index
    fetchingWeather: 'Fetching weather data...',
    saveLocationBtn: 'Save Location',
    savedLocationBtn: 'Saved',
    tapDetails: 'Tap for more details',
    retryText: 'Retry',

    // details
    noWeatherData: 'No weather data available.',
    goBack: 'Go Back',
    loadingDetails: 'Loading details...',

    // saved
    savedLocationsTitle: 'Saved Locations',
    loadingSaved: 'Loading saved locations...',
    emptySavedTitle: 'No saved locations yet.',
    emptySavedSubtitle: 'Save a location from the home screen to see it here.',
    deleteModalTitle: 'Delete Saved Location?',
    deleteModalSubtitle: 'Are you sure you want to remove %{city}? This action cannot be undone.',
    cancel: 'Cancel',

    // settings
    settingsTitle: 'Settings',
    tempUnitLabel: 'Temperature Unit',
    windUnitLabel: 'Wind Speed Unit',
    celsiusDesc: 'Celsius (°C)',
    fahrenheitDesc: 'Fahrenheit (°F)',
    kmhDesc: 'Kilometers per hour',
    mphDesc: 'Miles per hour',
    alertsLabel: 'Weather Alerts',
    alertsDesc: 'Get notified of weather updates at current location',
    hapticsLabel: 'Haptic Feedback',
    hapticsDesc: 'Vibrate on key actions like saving and refreshing',
    batterySaverLabel: 'Battery-Aware Refresh',
    batterySaverDesc: 'Reduce refresh frequency when battery is low or power saver is on',
    batterySaverBannerText: 'Battery Saver Active • Weather refresh frequency reduced',
    testNotification: 'Test Notification',
    testCrash: 'Test Crash',
    testNonFatal: 'Test Non-Fatal',
    accountLabel: 'Account',
    guestValue: 'Guest',
    signedInValue: 'Signed in',
    signOut: 'Sign Out',
    languageLabel: 'App Language',
    systemLanguage: 'System Default',
    englishLanguage: 'English',
    japaneseLanguage: 'Japanese',

    // Toasts & Messages
    toastDeletedTitle: 'Deleted',
    toastDeletedBody: 'Location removed from saved list.',
    toastSavedTitle: 'Saved',
    toastSavedBody: 'Location saved successfully.',
    toastErrorTitle: 'Error',
    toastErrorBody: 'Could not update saved location. Please try again.',
    toastConfirmDeletedTitle: 'Location deleted',
    toastConfirmDeletedBody: '%{city} was removed.',
    toastDeleteFailedTitle: 'Delete failed',
    toastDeleteFailedBody: 'Could not delete the location. Please try again.',
    toastMustBeLoggedIn: 'You must be logged in.',
    toastNoPushTokenTitle: 'Push Token Not Available',
    toastNoPushTokenBody:
      'Please ensure you have granted notification permissions in your device settings.',
    toastNoLocationTitle: 'Location Not Available',
    toastNoLocationBody:
      'Please ensure you have granted location permissions to get weather alerts for your current location.',
    toastUpdateSettingsError: 'Failed to update notification settings. Please try again.',
    toastPermissionRequiredTitle: 'Permission required',
    toastPermissionRequiredBody: 'Enable notifications in settings to receive alerts.',
    toastNotReadyTitle: 'Not ready',
    toastNotReadyBody: 'Push token is not available yet.',
    toastPushNotConfigured: 'Push service is not configured.',
    testNotificationTitle: 'Test Notification',
    testNotificationBody: 'Your notifications are set up and working!',
    toastTestSendFailed: 'Could not send the test notification.',

    // Services
    errLocationDenied: 'Permission to access location was denied',
    errLocationGpsCheck: 'Could not determine your location. Please check your GPS settings.',
    unknownLocation: 'Unknown Location',

    // Error boundary
    errorBoundaryTitle: 'We ran into a problem.',
    errorBoundarySubtitle: "We're sorry, but the application encountered an unexpected error.",
    errorBoundaryMessage: 'Please try restarting the app or try again later.',

    // Weather Conditions
    weatherClear: 'Clear Sky',
    weatherPartlyCloudy: 'Partly Cloudy',
    weatherCloudy: 'Cloudy',
    weatherFog: 'Fog',
    weatherDrizzle: 'Drizzle',
    weatherRain: 'Rain',
    weatherSnow: 'Snow',
    weatherShowers: 'Showers',
    weatherThunderstorm: 'Thunderstorm',
  },
  ja: {
    // CurrentWeather
    todayPrefix: '今日、',

    // DailyForecastList
    forecastTitle: '8日間の天気予報',
    forecastMax: '最高',
    forecastMin: '最低',

    // DetailsHeader
    updatedPrefix: '%{time} 更新',
    saveLocationLabel: '場所を保存',
    shareLabel: '天気を共有',
    shareDialogTitle: '天気を共有',
    shareMessage:
      '%{city}：%{condition}、現在%{temp}%{unit}（最高%{high}%{unit}、最低%{low}%{unit}）。',
    shareFailedTitle: '共有に失敗しました',
    shareFailedBody: '天気を共有できませんでした。もう一度お試しください。',

    // Copy coordinates
    copyCoordinatesHint: '長押しで座標をコピー',
    coordinatesCopiedTitle: '座標をコピーしました',
    copyFailedTitle: 'コピーに失敗しました',
    copyFailedBody: '座標をコピーできませんでした。もう一度お試しください。',

    // HourlyForecast
    hourlySummary:
      '残りの時間も%{condition}の状態が続くでしょう。最大瞬間風速は最大%{windSpeed} %{windUnit}です。',
    nowText: '現在',

    // OfflineIndicator
    offlineText: 'オフラインです。キャッシュされたデータを表示しています。',

    // SavedLocationItem
    deleteLabel: '削除',
    deleteAccessLabel: '%{city}を削除',
    savedPrefix: '%{savedAt}に保存',

    // SearchHeader
    searchPlaceholder: '都市を検索...',
    savedLocationsLabel: '保存済みの場所',
    recentSearchesTitle: '最近の検索',

    // Map
    mapButtonLabel: '天気マップ',
    mapTitle: '天気マップ',
    mapEmptyTitle: 'マップに表示するものがまだありません。',
    mapEmptySubtitle: '位置情報を有効にするか、場所を保存するとマップに表示されます。',
    mapViewDetailsLabel: '詳細を表示',
    mapZoomInLabel: 'ズームイン',
    mapZoomOutLabel: 'ズームアウト',
    mapPickResolving: '位置情報を取得中…',
    mapPickHint: 'マップ上を長押しして天気を表示します。',
    pickedSaveLabel: '場所を保存',
    pickedUnsaveLabel: '保存を解除',
    pickedDismissLabel: 'ピンを閉じる',
    pickedViewDetailsLabel: '詳細を表示',

    // WeatherSummaryCard
    humidityLabel: '湿度',
    windLabel: '風速',
    uvIndexLabel: 'UV指数',

    // Pressure
    pressureCardTitle: '気圧',
    pressureSensorLabel: 'デバイス',
    pressureForecastLabel: '予報',
    pressureUnit: 'hPa',
    pressureChecking: 'センサーを確認中...',
    pressureUnavailable: 'このデバイスには気圧計がありません。',
    pressureMatchesForecast: '予報と一致しています。',
    pressureAboveForecast: '予報より%{delta} hPa高い',
    pressureBelowForecast: '予報より%{delta} hPa低い',

    // login
    appName: 'Expoウェザー',
    loginSubtitle: '続行するにはサインインしてください',
    continueGoogle: 'Googleで続行',
    continueGuest: 'ゲストとして続行',
    googleFail: 'Googleサインインに失敗しました',
    guestFail: 'ゲストサインインに失敗しました',

    // index
    fetchingWeather: '気象情報を取得中...',
    saveLocationBtn: '場所を保存',
    savedLocationBtn: '保存済み',
    tapDetails: 'タップして詳細を表示',
    retryText: '再試行',

    // details
    noWeatherData: '気象データが利用できません。',
    goBack: '戻る',
    loadingDetails: '詳細を読み込み中...',

    // saved
    savedLocationsTitle: '保存済みの場所',
    loadingSaved: '保存済みの場所を読み込み中...',
    emptySavedTitle: '保存済みの場所はまだありません。',
    emptySavedSubtitle: 'ホーム画面から場所を保存すると、ここに表示されます。',
    deleteModalTitle: '保存済みの場所を削除しますか？',
    deleteModalSubtitle: '本当に%{city}を削除しますか？この操作は取り消せません。',
    cancel: 'キャンセル',

    // settings
    settingsTitle: '設定',
    tempUnitLabel: '気温の単位',
    windUnitLabel: '風速の単位',
    celsiusDesc: '摂氏 (°C)',
    fahrenheitDesc: '華氏 (°F)',
    kmhDesc: 'キロメートル毎時',
    mphDesc: 'マイル毎時',
    alertsLabel: '気象アラート',
    alertsDesc: '現在地の気象情報に関する通知を受け取ります',
    hapticsLabel: '触覚フィードバック',
    hapticsDesc: '保存や更新などの主要な操作で振動します',
    batterySaverLabel: 'バッテリー対応更新',
    batterySaverDesc:
      'バッテリー残量が少ないとき、またはバッテリーセーバーがオンのときに更新頻度を下げます',
    batterySaverBannerText: 'バッテリーセーバー有効 • 天気の更新頻度を下げています',
    testNotification: 'テスト通知',
    testCrash: 'テストクラッシュ',
    testNonFatal: 'テスト非致命的エラー',
    accountLabel: 'アカウント',
    guestValue: 'ゲスト',
    signedInValue: 'サインイン済み',
    signOut: 'サインアウト',
    languageLabel: 'アプリの言語',
    systemLanguage: 'システムデフォルト',
    englishLanguage: '英語 (English)',
    japaneseLanguage: '日本語 (Japanese)',

    // Toasts & Messages
    toastDeletedTitle: '削除完了',
    toastDeletedBody: '保存済みのリストから場所を削除しました。',
    toastSavedTitle: '保存完了',
    toastSavedBody: '場所を正常に保存しました。',
    toastErrorTitle: 'エラー',
    toastErrorBody: '保存場所を更新できませんでした。もう一度お試しください。',
    toastConfirmDeletedTitle: '削除完了',
    toastConfirmDeletedBody: '%{city}を削除しました。',
    toastDeleteFailedTitle: '削除失敗',
    toastDeleteFailedBody: '場所を削除できませんでした。もう一度お試しください。',
    toastMustBeLoggedIn: 'ログインする必要があります。',
    toastNoPushTokenTitle: 'プッシュトークン利用不可',
    toastNoPushTokenBody: 'デバイスの設定で通知の権限が許可されていることを確認してください。',
    toastNoLocationTitle: '位置情報利用不可',
    toastNoLocationBody: '現在地の気象アラートを受け取るには、位置情報の権限を許可してください。',
    toastUpdateSettingsError: '通知設定の更新に失敗しました。もう一度お試しください。',
    toastPermissionRequiredTitle: '権限が必要です',
    toastPermissionRequiredBody: 'アラートを受信するには設定で通知を有効にしてください。',
    toastNotReadyTitle: '準備中',
    toastNotReadyBody: 'プッシュトークンがまだ利用できません。',
    toastPushNotConfigured: 'プッシュサービスが設定されていません。',
    testNotificationTitle: 'テスト通知',
    testNotificationBody: '通知機能の設定が完了し、正常に動作しています！',
    toastTestSendFailed: 'テスト通知を送信できませんでした。',

    // Services
    errLocationDenied: '位置情報へのアクセス権限が拒否されました',
    errLocationGpsCheck: '現在地を特定できませんでした。GPS設定を確認してください。',
    unknownLocation: '不明な場所',

    // Error boundary
    errorBoundaryTitle: '問題が発生しました。',
    errorBoundarySubtitle: '申し訳ありません。アプリケーションで予期しないエラーが発生しました。',
    errorBoundaryMessage: 'アプリを再起動するか、後でもう一度お試しください。',

    // Weather Conditions
    weatherClear: '快晴',
    weatherPartlyCloudy: '晴れのち曇り',
    weatherCloudy: '曇り',
    weatherFog: '霧',
    weatherDrizzle: '霧雨',
    weatherRain: '雨',
    weatherSnow: '雪',
    weatherShowers: 'にわか雨',
    weatherThunderstorm: '雷雨',
  },
};

import { useSettingsStore } from '@/store/useSettingsStore';

export const i18n = new I18n(translations);

// Set the locale once at the beginning
const initialLanguage = useSettingsStore.getState().language ?? 'system';
if (initialLanguage === 'system') {
  i18n.locale = getLocales()[0]?.languageCode ?? 'en';
} else {
  i18n.locale = initialLanguage;
}
i18n.enableFallback = true;

// subscribe to changes to language in the store
useSettingsStore.subscribe((state) => {
  const selectedLanguage = state.language ?? 'system';
  if (selectedLanguage === 'system') {
    i18n.locale = getLocales()[0]?.languageCode ?? 'en';
  } else {
    i18n.locale = selectedLanguage;
  }
});

// Shorthand export
export const t = (key: string, options?: any) => i18n.t(key, options);
