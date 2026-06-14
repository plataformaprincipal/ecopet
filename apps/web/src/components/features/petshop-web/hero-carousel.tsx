import Image from "next/image";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80",
    title: "Bem-vindo ao Pet Shop ECOPET",
    text: "Cuidado premium para o seu melhor amigo — Grupo Café Platine",
  },
  {
    img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1200&q=80",
    title: "Banho, Tosa & Bem-estar",
    text: "Profissionais qualificados e produtos selecionados",
  },
  {
    img: "https://images.unsplash.com/photo-1628009368238-7bb8cfc3877f?w=1200&q=80",
    title: "Tele-busca Veterinária",
    text: "Agende consulta remota com um clique",
  },
  {
    img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80",
    title: "Entrega Domiciliar do Pet",
    text: "Buscamos e levamos seu pet com total segurança",
  },
];

export function HeroCarousel() {
  return (
    <div id="petshopHeroCarousel" className="carousel slide petshop-carousel" data-bs-ride="carousel">
      <div className="carousel-indicators">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            data-bs-target="#petshopHeroCarousel"
            data-bs-slide-to={i}
            className={i === 0 ? "active" : ""}
            aria-current={i === 0 ? "true" : undefined}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="carousel-inner">
        {SLIDES.map((slide, i) => (
          <div key={i} className={`carousel-item${i === 0 ? " active" : ""}`}>
            <Image
              src={slide.img}
              alt={slide.title}
              width={1200}
              height={600}
              className="d-block w-100"
              priority={i === 0}
              sizes="100vw"
            />
            <div className="carousel-caption d-none d-md-block">
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
              <a href="/petshop-web/agendamento" className="btn btn-warning fw-semibold text-dark mt-2">
                Agendar agora
              </a>
            </div>
          </div>
        ))}
      </div>

      <button id="carouselPrev" className="carousel-control-prev" type="button" data-bs-target="#petshopHeroCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Anterior</span>
      </button>
      <button id="carouselNext" className="carousel-control-next" type="button" data-bs-target="#petshopHeroCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Próximo</span>
      </button>
    </div>
  );
}
