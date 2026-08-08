import { type FormEvent, useState } from 'react';
import { z } from 'zod';

import { createPlayer } from '../api/playersApi';
import type { Player } from '../types';
import {
  formatCpf,
  formatPhone,
  initialPlayerRegistrationInput,
  playerRegistrationSchema,
  type PlayerRegistrationInput,
} from '../validation';

type FieldErrors = Partial<Record<keyof PlayerRegistrationInput, string>>;
type SubmissionState = { kind: 'editing' } | { kind: 'error'; message: string } | { kind: 'success'; player: Player };

const inputClass = 'mt-2 block min-h-[3.15rem] w-full border border-outline-variant bg-surface-low px-4 py-3 text-sm tracking-wide text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:bg-surface-container focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';

function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field as keyof PlayerRegistrationInput]) {
      errors[field as keyof PlayerRegistrationInput] = issue.message;
    }
  }
  return errors;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs font-medium tracking-wide text-rose-300">// {message}</p> : null;
}

export function PlayerSelfRegistrationPage() {
  const [form, setForm] = useState<PlayerRegistrationInput>(() => ({ ...initialPlayerRegistrationInput }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SubmissionState>({ kind: 'editing' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <Field extends keyof PlayerRegistrationInput>(field: Field, value: PlayerRegistrationInput[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (state.kind !== 'editing') setState({ kind: 'editing' });
  };

  const errorClass = (field: keyof PlayerRegistrationInput) => errors[field] ? ' border-rose-400 focus:border-rose-400 focus:ring-rose-400/20' : '';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = playerRegistrationSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      setState({ kind: 'error', message: 'Revise os campos sinalizados antes de enviar.' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const player = await createPlayer(parsed.data);
      setForm({ ...initialPlayerRegistrationInput });
      setState({ kind: 'success', player });
    } catch (error) {
      setState({ kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível enviar seu cadastro agora.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setForm({ ...initialPlayerRegistrationInput });
    setErrors({});
    setState({ kind: 'editing' });
  };

  if (state.kind === 'success') {
    return (
      <main className="grid min-h-screen place-items-center overflow-hidden bg-surface px-4 py-10 text-on-surface">
        <section className="w-full max-w-xl border border-primary/40 bg-surface-container p-7 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-10">
          <p className="text-xs font-bold tracking-[0.24em] text-primary">FIELD//MAN · REGISTRO CONFIRMADO</p>
          <div className="my-7 h-px bg-gradient-to-r from-primary via-primary/20 to-transparent" />
          <h1 className="text-3xl font-black uppercase tracking-tight text-on-surface sm:text-4xl">Cadastro transmitido.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-on-surface-variant">Sua ficha foi criada com sucesso. Informe o número abaixo na recepção quando chegar ao campo.</p>
          <div className="mt-8 border border-primary/30 bg-surface-container p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Identificação do jogador</p>
            <p className="mt-2 text-4xl font-black tracking-[0.08em] text-on-surface">#{state.player.registration_number}</p>
            <p className="mt-3 text-sm text-on-surface-variant">{state.player.name}</p>
          </div>
          <button type="button" onClick={reset} className="mt-8 min-h-[3.15rem] border border-outline px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary focus:outline-none focus:ring-2 focus:ring-primary">
            Novo cadastro
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-surface text-on-surface">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,94,0,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,94,0,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-primary" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.86fr_1.14fr]">
        <aside className="border-b border-outline-variant bg-surface-lowest px-6 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
          <p className="text-xs font-bold tracking-[0.24em] text-primary">FIELD//MAN</p>
          <div className="mt-14 max-w-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-outline">Acesso de jogador · 01</p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.92] tracking-tight text-on-surface sm:text-5xl">Prepare-se<span className="block text-primary">para o campo.</span></h1>
            <p className="mt-7 text-base leading-7 text-on-surface-variant">Complete seu cadastro antes do jogo. Na chegada, a recepção localiza sua ficha pelo número de identificação.</p>
          </div>
          <div className="mt-12 space-y-4 border-l border-primary/50 pl-5 text-xs leading-5 text-on-surface-variant">
            <p><span className="mr-2 text-primary">01</span>Dados essenciais para identificação.</p>
            <p><span className="mr-2 text-primary">02</span>Termo digital confirmado pelo jogador.</p>
            <p><span className="mr-2 text-primary">03</span>Número sequencial emitido após o envio.</p>
          </div>
        </aside>

        <section className="bg-surface-low/95 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cadastro pré-jogo</p>
                <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">Identificação do jogador</h2>
              </div>
              <span className="border border-outline-variant px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-on-surface-variant">SECURE FORM</span>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-6 text-on-surface-variant">Apenas os dados necessários para sua ficha e check-in. Campos marcados com <span className="text-primary">*</span> são obrigatórios.</p>

            <form noValidate onSubmit={submit} className="mt-9 space-y-5">
              <div>
                <label htmlFor="self-name" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Nome completo <span className="text-primary">*</span></label>
                <input id="self-name" name="name" type="text" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} className={`${inputClass}${errorClass('name')}`} aria-invalid={Boolean(errors.name)} placeholder="SEU NOME" disabled={isSubmitting} />
                <FieldError message={errors.name} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="self-cpf" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">CPF <span className="text-primary">*</span></label>
                  <input id="self-cpf" name="cpf" type="text" inputMode="numeric" autoComplete="off" value={form.cpf} onChange={(event) => update('cpf', formatCpf(event.target.value))} className={`${inputClass}${errorClass('cpf')}`} aria-invalid={Boolean(errors.cpf)} placeholder="000.000.000-00" disabled={isSubmitting} />
                  <FieldError message={errors.cpf} />
                </div>
                <div>
                  <label htmlFor="self-phone" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Telefone <span className="text-primary">*</span></label>
                  <input id="self-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', formatPhone(event.target.value))} className={`${inputClass}${errorClass('phone')}`} aria-invalid={Boolean(errors.phone)} placeholder="(00) 00000-0000" disabled={isSubmitting} />
                  <FieldError message={errors.phone} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="self-email" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">E-mail <span className="text-primary">*</span></label>
                  <input id="self-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={`${inputClass}${errorClass('email')}`} aria-invalid={Boolean(errors.email)} placeholder="VOCE@EMAIL.COM" disabled={isSubmitting} />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <label htmlFor="self-birth-date" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Data de nascimento <span className="text-primary">*</span></label>
                  <input id="self-birth-date" name="date_of_birth" type="date" autoComplete="bday" value={form.date_of_birth} onChange={(event) => update('date_of_birth', event.target.value)} className={`${inputClass}${errorClass('date_of_birth')}`} aria-invalid={Boolean(errors.date_of_birth)} disabled={isSubmitting} />
                  <FieldError message={errors.date_of_birth} />
                </div>
              </div>
              <div className={`border p-4 ${errors.terms_accepted ? 'border-rose-400/80 bg-rose-400/5' : 'border-outline-variant bg-surface-container'}`}>
                <label htmlFor="self-terms" className="flex cursor-pointer items-start gap-3">
                  <input id="self-terms" name="terms_accepted" type="checkbox" checked={form.terms_accepted} onChange={(event) => update('terms_accepted', event.target.checked)} className="mt-0.5 h-4 w-4 border-outline bg-surface-low text-primary focus:ring-primary" disabled={isSubmitting} />
                  <span className="text-sm leading-6 text-on-surface-variant">Confirmo que li e aceitei o termo digital, incluindo o tratamento destes dados para a operação do evento e comunicação conforme autorizado.</span>
                </label>
                <FieldError message={errors.terms_accepted} />
              </div>
              <div aria-live="polite">{state.kind === 'error' && <p role="alert" className="border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100">{state.message}</p>}</div>
              <button type="submit" disabled={isSubmitting} className="group flex min-h-[3.5rem] w-full items-center justify-between bg-primary px-5 py-3 text-left text-sm font-black uppercase tracking-[0.14em] text-on-primary transition hover:bg-primary focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-primary/50">
                <span>{isSubmitting ? 'Transmitindo cadastro...' : 'Enviar cadastro'}</span><span className="text-xl transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>
            </form>
            <p className="mt-7 text-[11px] leading-5 text-outline">// Seus dados seguem diretamente para o sistema operacional do campo.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
