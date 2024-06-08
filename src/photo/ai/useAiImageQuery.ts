import { useCallback, useState } from 'react';
import { streamAiImageQueryAction } from '../actions';
import { readStreamableValue } from 'ai/rsc';
import { AiImageQuery } from '.';

export default function useAiImageQuery(
  imageBase64: string | undefined,
  query: AiImageQuery,
) {
  const [text, setText] = useState('');
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);

  const request = useCallback(async () => {
    if (imageBase64) {
      setIsLoading(true);
      setText('');
      try {
        streamAiImageQueryAction(
          imageBase64,
          query,
        ).then(async (textStream) => {
            console.log("查询结果", textStream);
            setText((textStream ?? text));
        });
        // console.log("查询结果", textStream);
        // setText((textStream ?? text));
        setIsLoading(false);
      } catch (e) {
        console.log("出错", e);
        setError(e);
        setIsLoading(false);
      }
    }
  }, [imageBase64, query]);

  const reset = useCallback(() => {
    setText('');
    setError(undefined);
    setIsLoading(false);
  }, []);

  // Withhold streaming text if it's a null response
  const isTextError = text.toLocaleLowerCase().startsWith('sorry');

  return [
    request,
    isTextError ? '' : text,
    isLoading,
    reset,
    error,
  ] as const;
};
