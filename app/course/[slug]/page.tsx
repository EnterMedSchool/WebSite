type Props = { params: { slug: string } };

export default function CoursePage({ params }: Props) {
  const { slug } = params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Course: {slug}</h1>
      <p className="text-gray-600">
        This is a dynamic route example. Later, this page will render lessons, syllabus, progress, and media for the course identified by the slug.
      </p>
    </div>
  );
}

