import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } }),
    defineField({ name: 'course', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'content', title: 'Content', type: 'blockContent' }),
    defineField({ name: 'language', title: 'Language', type: 'string', options: { list: ['en', 'es', 'fr', 'de'] } }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
})

