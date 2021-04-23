export const getTags = (text: string): String[] => {
  const tags = text
    .split(' ')
    .filter((t) => t.charAt(0) === '#')
    .join('')
    .split('#');
  tags.shift();
  return tags;
};

export const parseQuery = (query: string) => {
  const words = new Set<String>();
  const tags = new Set<String>();

  query.split(' ').forEach((t) => {
    if (t.charAt(0) === '#') {
      const _tags = t.split('#');

      _tags.shift();
      _tags.forEach((tag) => {
        tags.add(tag);
      });
    } else {
      words.add(t);
    }
  });
  return [Array.from(words), Array.from(tags)];
};
