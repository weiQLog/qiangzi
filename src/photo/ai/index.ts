/* eslint-disable max-len */

export type AiAutoGeneratedField =
  'title' |
  'caption' |
  'tags' |
  'semantic'

export const ALL_AI_AUTO_GENERATED_FIELDS: AiAutoGeneratedField[] = [
  'title',
  'caption',
  'tags',
  'semantic',
];

export const parseAiAutoGeneratedFieldsText = (
  text = 'all',
): AiAutoGeneratedField[] => {
  const textFormatted = text.trim().toLocaleLowerCase();
  if (textFormatted === 'none') {
    return [];
  } else if (textFormatted === 'all') {
    return ALL_AI_AUTO_GENERATED_FIELDS;
  } else {
    const fields = textFormatted
      .toLocaleLowerCase()
      .split(',')
      .map(field => field.trim())
      .filter(field => ALL_AI_AUTO_GENERATED_FIELDS
        .includes(field as AiAutoGeneratedField));
    return fields as AiAutoGeneratedField[];
  }
};

export type AiImageQuery =
  'title' |
  'caption' |
  'title-and-caption' |
  'tags' |
  'description-small' |
  'description' |
  'description-large' |
  'description-semantic';

export const AI_IMAGE_QUERIES: Record<AiImageQuery, string> = {
  'title': '用中文回复，为这张图片取一个5个字以内的简短标题',
  'caption': '用中文回复，为这张图片取一个6个字以内的短文本描述',
  'title-and-caption': '用中文回复，用8个字以内的格式写一个简短的标题和简洁的说明，格式为 标题："title" 说明："caption"',
  'tags': '用中文回复，用三个或更少的逗号分隔的关键词描述这个图片，不要用形容词或副词',
  'description-small': '用中文回复，简洁地描述这个图片，不要使用开头的文字“这张图片展示了”或“这是……的图片”',
  'description': '用中文回复，描述这个图片',
  'description-large': '用中文回复，详细描述这个图片',
  'description-semantic': '用中文回复，列出这个图片中的最多5个物品，用comma-separated分隔，不需要描述',
};

export const parseTitleAndCaption = (text: string) => {
  const matches = text.includes('Title')
    ? text.match(/^[`'"]*Title: ["']*(.*?)["']*[ ]*Caption: ["']*(.*?)\.*["']*[`'"]*$/)
    : text.match(/^(.*?): (.*?)$/);

  return {
    title: matches?.[1] ?? '',
    caption: matches?.[2] ?? '',
  };
};
