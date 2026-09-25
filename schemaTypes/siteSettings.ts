import { defineArrayMember, defineField, defineType } from 'sanity';

const localeString = (name: string, title: string, rows?: number) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'en', title: 'English', type: rows ? 'text' : 'string', rows }),
      defineField({ name: 'id', title: 'Indonesian', type: rows ? 'text' : 'string', rows }),
    ],
  });

const phraseList = (name: 'en' | 'id', title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [defineArrayMember({ type: 'string' })],
  });

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    localeString('name', 'Site name'),
    localeString('title', 'Default page title'),
    localeString('description', 'Description', 4),
    defineField({
      name: 'phrases',
      title: 'Phrases',
      type: 'object',
      description: 'Short phrases search engines should associate with Little Runa. They are not shown as a keyword tag.',
      fields: [phraseList('en', 'English'), phraseList('id', 'Indonesian')],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' }),
  },
});
