import { defineField, defineType } from 'sanity';

const localeText = (name: string, title: string, kind: 'string' | 'text') =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({
        name: 'en',
        title: 'English',
        type: kind,
        rows: kind === 'text' ? (name === 'body' ? 16 : 3) : undefined,
        validation: (rule) => (name === 'title' ? rule.required() : rule),
      }),
      defineField({
        name: 'id',
        title: 'Indonesian',
        type: kind,
        rows: kind === 'text' ? (name === 'body' ? 16 : 3) : undefined,
      }),
    ],
  });

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    localeText('title', 'Title', 'string'),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    localeText('excerpt', 'Excerpt', 'text'),
    localeText('body', 'Body', 'text'),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'publishedAt' },
  },
});
