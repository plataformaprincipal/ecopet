"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/petshop-web", label: "Início" },
  { href: "/petshop-web/cadastro-cliente", label: "Cadastro Cliente" },
  { href: "/petshop-web/cadastro-pet", label: "Cadastro Pet" },
  { href: "/petshop-web/agendamento", label: "Agendamento" },
];

const INTEGRATIONS = [
  { href: "/marketplace", label: "Marketplace ECOPET", external: false },
  { href: "/inicio", label: "Rede Social", external: false },
  { href: "/health", label: "ECOPET Health", external: false },
  { href: "/dashboard/petshop", label: "Painel Pet Shop", external: false },
];

export function PetshopHeader() {
  const pathname = usePathname();

  return (
    <>
      <div className="petshop-promo-bar">
        <span>🐾 Tele-busca e entrega domiciliar disponíveis · Agende online · ECOPET — Grupo Café Platine</span>
      </div>

      <nav className="navbar navbar-expand-lg navbar-dark petshop-navbar sticky-top">
        <div className="container">
          <Link href="/petshop-web" className="navbar-brand d-flex align-items-center gap-2">
            <span className="fs-4">🐾</span>
            <div>
              <span className="d-block lh-1">Pet Shop ECOPET</span>
              <small className="opacity-75 fw-normal" style={{ fontSize: "0.65rem" }}>Grupo Café Platine</small>
            </div>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#petshopNav"
            aria-controls="petshopNav"
            aria-expanded="false"
            aria-label="Menu"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="petshopNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {NAV.map((item) => (
                <li className="nav-item" key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link${pathname === item.href ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Integrações ECOPET
                </a>
                <ul className="dropdown-menu">
                  {INTEGRATIONS.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="dropdown-item">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3">
              <div className="petshop-clock d-none d-lg-block" id="petshop-clock" aria-live="polite" />
              <Link href="/login" className="btn btn-outline-light btn-sm">Entrar</Link>
              <Link href="/petshop-web/cadastro-cliente" className="btn btn-warning btn-sm fw-semibold text-dark">
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
