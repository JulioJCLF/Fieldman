import { type FormEvent, useState } from 'react';
import { z } from 'zod';

import { createPlayer } from '../api/playersApi';
import { CLIENT_TYPES, type ClientType, type Player } from '../types';
import {
  formatCpf,
  formatPhone,
  initialPlayerRegistrationInput,
  playerRegistrationSchema,
  type PlayerRegistrationInput,
} from '../validation';

interface PlayerRegistrationFormProps {
  onRegistered: (player: Player) => void;
}

type FieldErrors = Partial<Record<keyof PlayerRegistrationInput, string>>;

type SubmissionState =
  | { kind: 'idle' }
  | { kind: 'success'; player: Player }
  | { kind: 'error'; message: string };

const clientTypeLabels: Record<ClientType, string> = {
  OPEN_GAME: 'Jogos abertos',
  PRIVATE_GAME: 'Jogos privados',
  BOTH: 'Ambos',
};

const baseInputClass =
  'mt-2 block min-h-[3rem] w-full border border-[#3c4639] bg-[#111611] px-3.5 py-2.5 font-mono text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-lime-300 focus:bg-[#151c14] focus:ring-2 focus:ring-lime-300/20 disabled:cursor-not-allowed disabled:opacity-60';

function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') {
      const typedField = field as keyof PlayerRegistrationInput;
      if (!fieldErrors[typedField]) {
        fieldErrors[typedField] = issue.message;
      }
    }
  }

  return fieldErrors;
}

export function PlayerRegistrationForm({ onRegistered }: PlayerRegistrationFormProps) {
  const [form, setForm] = useState<PlayerRegistrationInput>(() => ({ ...initialPlayerRegistrationInput }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ kind: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <Field extends keyof PlayerRegistrationInput>(
    field: Field,
    value: PlayerRegistrationInput[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionState({ kind: 'idle' });
  };

  const inputClass = (field: keyof PlayerRegistrationInput) =>
    `${baseInputClass} ${
      fieldErrors[field]
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
    }`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState({ kind: 'idle' });

    const parsed = playerRegistrationSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFrom(parsed.error));
      setSubmissionState({ kind: 'error', message: 'Revise os campos destacados antes de cadastrar.' });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const player = await createPlayer(parsed.data);
      setSubmissionState({ kind: 'success', player });
      setForm({ ...initialPlayerRegistrationInput });
      onRegistered(player);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível cadastrar o jogador.';
      setSubmissionState({ kind: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="registration-title" className="border border-[#384534] bg-[#0d120d] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-7">
      <div className="mb-7 flex flex-col gap-3 border-b border-[#2d382a] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Cadastro ágil // nova ficha</p>
          <h2 id="registration-title" className="mt-2 text-2xl font-bold tracking-tight text-white">
            Novo jogador
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Preencha somente o essencial. O número de cadastro é atribuído pelo servidor.
          </p>
        </div>
        <span className="w-fit border border-[#455043] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-stone-400">
          API SECURE
        </span>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="player-name" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              Nome completo <span aria-hidden="true" className="text-lime-300">*</span>
            </label>
            <input
              id="player-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'player-name-error' : undefined}
              className={inputClass('name')}
              placeholder="Ex.: Ana Oliveira"
              disabled={isSubmitting}
            />
            {fieldErrors.name && <p id="player-name-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="player-cpf" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              CPF <span aria-hidden="true" className="text-lime-300">*</span>
            </label>
            <input
              id="player-cpf"
              name="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.cpf}
              onChange={(event) => updateField('cpf', formatCpf(event.target.value))}
              aria-invalid={Boolean(fieldErrors.cpf)}
              aria-describedby={fieldErrors.cpf ? 'player-cpf-error' : undefined}
              className={inputClass('cpf')}
              placeholder="000.000.000-00"
              disabled={isSubmitting}
            />
            {fieldErrors.cpf && <p id="player-cpf-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.cpf}</p>}
          </div>

          <div>
            <label htmlFor="player-phone" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              Telefone <span aria-hidden="true" className="text-lime-300">*</span>
            </label>
            <input
              id="player-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', formatPhone(event.target.value))}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'player-phone-error' : undefined}
              className={inputClass('phone')}
              placeholder="(11) 99999-9999"
              disabled={isSubmitting}
            />
            {fieldErrors.phone && <p id="player-phone-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="player-email" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              E-mail <span aria-hidden="true" className="text-lime-300">*</span>
            </label>
            <input
              id="player-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'player-email-error' : undefined}
              className={inputClass('email')}
              placeholder="ana@email.com"
              disabled={isSubmitting}
            />
            {fieldErrors.email && <p id="player-email-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="player-birth-date" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              Data de nascimento <span aria-hidden="true" className="text-lime-300">*</span>
            </label>
            <input
              id="player-birth-date"
              name="date_of_birth"
              type="date"
              autoComplete="bday"
              value={form.date_of_birth}
              onChange={(event) => updateField('date_of_birth', event.target.value)}
              aria-invalid={Boolean(fieldErrors.date_of_birth)}
              aria-describedby={fieldErrors.date_of_birth ? 'player-birth-date-error' : undefined}
              className={inputClass('date_of_birth')}
              disabled={isSubmitting}
            />
            {fieldErrors.date_of_birth && (
              <p id="player-birth-date-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.date_of_birth}</p>
            )}
          </div>

          <div>
            <label htmlFor="player-client-type" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
              Participação mais comum
            </label>
            <select
              id="player-client-type"
              name="client_type"
              value={form.client_type}
              onChange={(event) => updateField('client_type', event.target.value as ClientType)}
              className={inputClass('client_type')}
              disabled={isSubmitting}
            >
              {CLIENT_TYPES.map((clientType) => (
                <option key={clientType} value={clientType}>{clientTypeLabels[clientType]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="player-profile" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-300">
            Perfil ou observação <span className="font-normal text-stone-500">(opcional)</span>
          </label>
          <textarea
            id="player-profile"
            name="profile"
            rows={3}
            value={form.profile ?? ''}
            onChange={(event) => updateField('profile', event.target.value)}
            aria-invalid={Boolean(fieldErrors.profile)}
            aria-describedby={fieldErrors.profile ? 'player-profile-error' : undefined}
            className={inputClass('profile')}
            placeholder="Ex.: jogador casual, observações de atendimento…"
            disabled={isSubmitting}
          />
          {fieldErrors.profile && <p id="player-profile-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.profile}</p>}
        </div>

        <div className="border border-[#3c4639] bg-[#0a0e0a] p-4">
          <label htmlFor="player-terms" className="flex cursor-pointer items-start gap-3">
            <input
              id="player-terms"
              name="terms_accepted"
              type="checkbox"
              checked={form.terms_accepted}
              onChange={(event) => updateField('terms_accepted', event.target.checked)}
              aria-invalid={Boolean(fieldErrors.terms_accepted)}
              aria-describedby={fieldErrors.terms_accepted ? 'player-terms-error' : undefined}
              className="mt-0.5 h-4 w-4 border-stone-600 bg-[#111611] text-lime-400 focus:ring-lime-400"
              disabled={isSubmitting}
            />
            <span className="text-sm leading-6 text-stone-300">
              Confirmo que o jogador aceitou o termo digital e autorizou o tratamento dos dados para a finalidade informada.
            </span>
          </label>
          {fieldErrors.terms_accepted && (
            <p id="player-terms-error" className="mt-2 text-xs text-rose-300">// {fieldErrors.terms_accepted}</p>
          )}
        </div>

        <div aria-live="polite">
          {submissionState.kind === 'error' && (
            <p role="alert" className="border border-rose-400/50 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {submissionState.message}
            </p>
          )}
          {submissionState.kind === 'success' && (
            <p className="border border-lime-300/40 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
              Jogador cadastrado. Número de cadastro: <strong>#{submissionState.player.registration_number}</strong>.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[3rem] w-full items-center justify-center bg-lime-300 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#080b08] transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 disabled:cursor-not-allowed disabled:bg-lime-300/50 sm:w-auto"
        >
          {isSubmitting ? 'Cadastrando…' : 'Cadastrar jogador'}
        </button>
      </form>
    </section>
  );
}
