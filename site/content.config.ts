import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const postCollection = (name: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.md', base: `./content/${name}` }),
    // Type-check frontmatter using a schema
    schema: z.object({
      title: z.string(),
      description: z.string(),
      slug: z.string().optional(),
      // Transform string to Date object
      date: z.coerce.date(),
      image: z.string().optional(),
    }),
  });

// i18next translation collection
const translationsCollection = defineCollection({
  // make sure to keep a `slug` field in the JSON file for the key in Astro
  loader: glob({
    pattern: `**/translation.json`,
    base: `./public/locales`,
  }),
  // just a map of string to string
  schema: z.any(),
});

export const collections = {
  'blog-en': postCollection('blog-en'),
  'blog-zh': postCollection('blog-zh'),
  translations: translationsCollection,
};
