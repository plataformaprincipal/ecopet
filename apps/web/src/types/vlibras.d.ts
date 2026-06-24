import "react";

/** Atributos exigidos pelo VLibras Widget 6.0 (gov.br) */
declare module "react" {
  interface HTMLAttributes<T> {
    vw?: "";
    "vw-access-button"?: "";
    "vw-plugin-wrapper"?: "";
  }
}
