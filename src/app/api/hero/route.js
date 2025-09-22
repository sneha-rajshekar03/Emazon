export async function GET() {
  const heroData = {
    hero: {
      title: "Big Sale is Here!",
      subtitle: "Up to 50% off on selected items 🎉",
      image: "https://img.pikbest.com/origin/09/41/88/43CpIkbEsT3nd.jpg!w700wp",
    },
  };

  return Response.json(heroData);
}
