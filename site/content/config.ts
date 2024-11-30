import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    date: z.coerce.date(),
    image: z.string().optional(),
  }),
});

export const collections = {
  'blog-en': blog,
  'blog-zh': blog,
};
