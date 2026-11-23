import { useEffect, useRef, type ComponentRef } from 'react';
import { Keyboard, type ScrollView } from 'react-native';

/**
 * Ekranın altındaki çok satırlı metin kutusu için: klavye açılınca ve yazdıkça metin
 * uzadıkça kaydırma alanını sona götürür, böylece yazılan yer klavyenin altında kalmaz.
 */
export function useScrollToInput() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const focused = useRef(false);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (focused.current) scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => subscription.remove();
  }, []);

  const inputProps = {
    onFocus: () => {
      focused.current = true;
      // Klavye başka bir alandan dolayı zaten açıksa keyboardDidShow gelmez.
      if (Keyboard.isVisible()) scrollRef.current?.scrollToEnd({ animated: true });
    },
    onBlur: () => {
      focused.current = false;
    },
    onContentSizeChange: () => {
      if (focused.current) scrollRef.current?.scrollToEnd({ animated: true });
    },
  };

  return { scrollRef, inputProps };
}
