"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessibleFormDemo() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    newsletter: false,
    contact: "email",
    species: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const helpId = "demo-form-help";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Formulário de exemplo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-describedby={helpId}>
          <p id={helpId} className="text-sm text-muted-foreground">
            Todos os campos marcados com * são obrigatórios. Este formulário é apenas demonstrativo.
          </p>

          <div>
            <label htmlFor="demo-name" className="mb-1 block text-sm font-medium">
              Nome completo *
            </label>
            <Input
              id="demo-name"
              type="text"
              placeholder="Digite seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              aria-describedby="demo-name-hint"
            />
            <p id="demo-name-hint" className="mt-1 text-xs text-muted-foreground">
              Campo de texto simples com placeholder.
            </p>
          </div>

          <div>
            <label htmlFor="demo-email" className="mb-1 block text-sm font-medium">
              E-mail *
            </label>
            <Input
              id="demo-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="demo-age" className="mb-1 block text-sm font-medium">
              Idade do pet (anos)
            </label>
            <Input
              id="demo-age"
              type="number"
              min={0}
              max={30}
              placeholder="Ex.: 3"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              aria-describedby="demo-age-hint"
            />
            <p id="demo-age-hint" className="mt-1 text-xs text-muted-foreground">
              Campo numérico com valor mínimo e máximo.
            </p>
          </div>

          <div>
            <label htmlFor="demo-password" className="mb-1 block text-sm font-medium">
              Senha de exemplo
            </label>
            <Input
              id="demo-password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              aria-describedby="demo-password-hint"
            />
            <p id="demo-password-hint" className="mt-1 text-xs text-muted-foreground">
              Campo de senha — não será armazenado.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.newsletter}
                onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
                aria-describedby="demo-checkbox-hint"
              />
              Desejo receber novidades por e-mail
            </label>
            <p id="demo-checkbox-hint" className="mt-1 text-xs text-muted-foreground">
              Exemplo de checkbox.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Preferência de contato *</legend>
            <div className="flex flex-wrap gap-4" role="radiogroup">
              {[
                { value: "email", label: "E-mail" },
                { value: "phone", label: "Telefone" },
                { value: "whatsapp", label: "WhatsApp" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contact"
                    value={opt.value}
                    checked={form.contact === opt.value}
                    onChange={() => setForm({ ...form, contact: opt.value })}
                    required
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="demo-species" className="mb-1 block text-sm font-medium">
              Espécie do pet
            </label>
            <select
              id="demo-species"
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
            >
              <option value="">Selecione...</option>
              <option value="dog">Cão</option>
              <option value="cat">Gato</option>
              <option value="bird">Ave</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="demo-message" className="mb-1 block text-sm font-medium">
              Mensagem
            </label>
            <textarea
              id="demo-message"
              className="w-full rounded border px-3 py-2 text-sm"
              rows={4}
              placeholder="Escreva sua mensagem aqui..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <Button type="submit">Enviar demonstração</Button>

          {submitted && (
            <p role="status" className="text-sm text-green-700">
              Formulário enviado com sucesso (demonstração — nenhum dado foi gravado).
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
