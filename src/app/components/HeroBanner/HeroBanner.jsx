export default function HeroBanner({ hero }) {
  return (
    <section
      className="w-full h-64 sm:h-96 bg-cover bg-center rounded-xl flex items-center justify-center text-white mb-4"
      style={{ backgroundImage: `url(${hero.image})` }}
    >
      <div className="bg-black bg-opacity-50 p-3 rounded-lg text-center">
        <h1 className="text-3xl sm:text-5xl font-bold">{hero.title}</h1>
        <p className="mt-2 text-lg">{hero.subtitle}</p>
      </div>
    </section>
  );
}
