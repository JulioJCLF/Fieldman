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

const inputClass = 'mt-2 block min-h-[3.15rem] w-full border border-[#3c4639] bg-[#111611] px-4 py-3 font-mono text-sm tracking-wide text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-lime-400 focus:bg-[#151c14] focus:ring-2 focus:ring-lime-400/20 disabled:cursor-not-allowed disabled:opacity-60';

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
      <main className="grid min-h-screen place-items-center overflow-hidden bg-[#080b08] px-4 py-10 text-stone-100">
        <section className="w-full max-w-xl border border-lime-400/40 bg-[#0e140d] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-10">
          <p className="font-mono text-xs font-bold tracking-[0.24em] text-lime-300">FIELD//MAN · REGISTRO CONFIRMADO</p>
          <div className="my-7 h-px bg-gradient-to-r from-lime-400 via-lime-400/20 to-transparent" />
          <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Cadastro transmitido.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-300">Sua ficha foi criada com sucesso. Informe o número abaixo na recepção quando chegar ao campo.</p>
          <div className="mt-8 border border-lime-400/30 bg-[#101a0f] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-lime-300">Identificação do jogador</p>
            <p className="mt-2 font-mono text-4xl font-black tracking-[0.08em] text-white">#{state.player.registration_number}</p>
            <p className="mt-3 text-sm text-stone-300">{state.player.name}</p>
          </div>
          <button type="button" onClick={reset} className="mt-8 min-h-[3.15rem] border border-stone-600 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-lime-300 hover:bg-lime-300 hover:text-[#080b08] focus:outline-none focus:ring-2 focus:ring-lime-300">
            Novo cadastro
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b08] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(163,230,53,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-lime-400" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.86fr_1.14fr]">
        <aside className="border-b border-[#2a3328] bg-[#0d110d] px-6 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
          <p className="font-mono text-xs font-bold tracking-[0.24em] text-lime-300">FIELD//MAN</p>
          <div className="mt-14 max-w-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">Acesso de jogador · 01</p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-5xl">Prepare-se<span className="block text-lime-300">para o campo.</span></h1>
            <p className="mt-7 text-base leading-7 text-stone-400">Complete seu cadastro antes do jogo. Na chegada, a recepção localiza sua ficha pelo número de identificação.</p>
          </div>
          <div className="mt-12 space-y-4 border-l border-lime-400/50 pl-5 font-mono text-xs leading-5 text-stone-400">
            <p><span className="mr-2 text-lime-300">01</span>Dados essenciais para identificação.</p>
            <p><span className="mr-2 text-lime-300">02</span>Termo digital confirmado pelo jogador.</p>
            <p><span className="mr-2 text-lime-300">03</span>Número sequencial emitido após o envio.</p>
          </div>
        </aside>

        <section className="bg-[#111611]/95 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Cadastro pré-jogo</p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Identificação do jogador</h2>
              </div>
              <span className="border border-[#455043] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-stone-400">SECURE FORM</span>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-6 text-stone-400">Apenas os dados necessários para sua ficha e check-in. Campos marcados com <span className="text-lime-300">*</span> são obrigatórios.</p>

            <form noValidate onSubmit={submit} className="mt-9 space-y-5">
              <div>
                <label htmlFor="self-name" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">Nome completo <span className="text-lime-300">*</span></label>
                <input id="self-name" name="name" type="text" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} className={`${inputClass}${errorClass('name')}`} aria-invalid={Boolean(errors.name)} placeholder="SEU NOME" disabled={isSubmitting} />
                <FieldError message={errors.name} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="self-cpf" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">CPF <span className="text-lime-300">*</span></label>
                  <input id="self-cpf" name="cpf" type="text" inputMode="numeric" autoComplete="off" value={form.cpf} onChange={(event) => update('cpf', formatCpf(event.target.value))} className={`${inputClass}${errorClass('cpf')}`} aria-invalid={Boolean(errors.cpf)} placeholder="000.000.000-00" disabled={isSubmitting} />
                  <FieldError message={errors.cpf} />
                </div>
                <div>
                  <label htmlFor="self-phone" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">Telefone <span className="text-lime-300">*</span></label>
                  <input id="self-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', formatPhone(event.target.value))} className={`${inputClass}${errorClass('phone')}`} aria-invalid={Boolean(errors.phone)} placeholder="(00) 00000-0000" disabled={isSubmitting} />
                  <FieldError message={errors.phone} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="self-email" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">E-mail <span className="text-lime-300">*</span></label>
                  <input id="self-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={`${inputClass}${errorClass('email')}`} aria-invalid={Boolean(errors.email)} placeholder="VOCE@EMAIL.COM" disabled={isSubmitting} />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <label htmlFor="self-birth-date" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">Data de nascimento <span className="text-lime-300">*</span></label>
                  <input id="self-birth-date" name="date_of_birth" type="date" autoComplete="bday" value={form.date_of_birth} onChange={(event) => update('date_of_birth', event.target.value)} className={`${inputClass}${errorClass('date_of_birth')}`} aria-invalid={Boolean(errors.date_of_birth)} disabled={isSubmitting} />
                  <FieldError message={errors.date_of_birth} />
                </div>
              </div>
              <div className={`border p-4 ${errors.terms_accepted ? 'border-rose-400/80 bg-rose-400/5' : 'border-[#3c4639] bg-[#0c100c]'}`}>
                <label htmlFor="self-terms" className="flex cursor-pointer items-start gap-3">
                  <input id="self-terms" name="terms_accepted" type="checkbox" checked={form.terms_accepted} onChange={(event) => update('terms_accepted', event.target.checked)} className="mt-0.5 h-4 w-4 border-stone-600 bg-[#111611] text-lime-400 focus:ring-lime-400" disabled={isSubmitting} />
                  <span className="text-sm leading-6 text-stone-300">Confirmo que li e aceitei o termo digital, incluindo o tratamento destes dados para a operação do evento e comunicação conforme autorizado.</span>
                </label>
                <FieldError message={errors.terms_accepted} />
              </div>
              <div aria-live="polite">{state.kind === 'error' && <p role="alert" className="border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100">{state.message}</p>}</div>
              <button type="submit" disabled={isSubmitting} className="group flex min-h-[3.5rem] w-full items-center justify-between bg-lime-300 px-5 py-3 text-left font-mono text-sm font-black uppercase tracking-[0.14em] text-[#080b08] transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 disabled:cursor-not-allowed disabled:bg-lime-300/50">
                <span>{isSubmitting ? 'Transmitindo cadastro...' : 'Enviar cadastro'}</span><span className="text-xl transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>
            </form>
            <p className="mt-7 font-mono text-[11px] leading-5 text-stone-500">// Seus dados seguem diretamente para o sistema operacional do campo.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
