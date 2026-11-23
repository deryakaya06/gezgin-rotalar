import type { ComponentProps } from 'react';
import { useColorScheme } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { BodyFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

LocaleConfig.locales.tr = {
  monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

/** Türkçe, pazartesiyle başlayan ve uygulama paletini kullanan takvim. */
export function ThemedCalendar(props: ComponentProps<typeof Calendar>) {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <Calendar
      // Kütüphane temayı yalnızca ilk çizimde okur; koyu moda geçince yeniden kurulur.
      key={scheme ?? 'light'}
      firstDay={1}
      theme={{
        calendarBackground: theme.surface,
        dayTextColor: theme.text,
        textDisabledColor: theme.placeholder,
        monthTextColor: theme.text,
        textSectionTitleColor: theme.textSecondary,
        arrowColor: theme.primary,
        todayTextColor: theme.highlight,
        selectedDayBackgroundColor: theme.primary,
        selectedDayTextColor: theme.onPrimary,
        textDayFontFamily: BodyFamily[600],
        textMonthFontFamily: BodyFamily[700],
        textDayHeaderFontFamily: BodyFamily[600],
      }}
      {...props}
    />
  );
}
