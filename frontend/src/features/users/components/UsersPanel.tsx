import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { Alert, Badge, Button, Card, Field, Modal, TextInput } from '../../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { ApiError, createUser, deleteUser, listUsers, updateUser } from '../api/usersApi';
import type { StaffUser } from '../types';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

type Dialog =
  | { mode: 'create' }
  | { mode: 'edit'; user: StaffUser }
  | { mode: 'delete'; user: StaffUser }
  | null;

export function UsersPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="border-b border-outline-variant pb-8">
        <p className="text-xs font-bold text-primary">Módulo 06 · admin/usuários</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Usuários do sistema.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              Gerencie quem pode acessar o console: crie novos operadores, altere e-mail ou senha e remova acessos.
            </p>
          </div>
          <Button onClick={() => setDialog({ mode: 'create' })}>+ Novo usuário</Button>
        </div>
      </section>

      <div className="mt-8">
        <Card title="Staff com acesso" actions={<Button variant="ghost" size="sm" onClick={() => void load()}>Atualizar</Button>}>
          {error && <div className="mb-4"><Alert>{error}</Alert></div>}

          {loading ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Carregando usuários…</p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Nenhum usuário cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-xs font-medium text-outline">
                    <th className="pb-3 pr-4 font-medium">E-mail</th>
                    <th className="pb-3 pr-4 font-medium">Criado em</th>
                    <th className="pb-3 pr-4 font-medium">Último acesso</th>
                    <th className="pb-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id}>
                        <td className="py-3 pr-4">
                          <span className="font-medium text-on-surface">{u.email}</span>
                          {isSelf && <span className="ml-2"><Badge tone="info">você</Badge></span>}
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">{formatDateTime(u.created_at)}</td>
                        <td className="py-3 pr-4 text-on-surface-variant">{formatDateTime(u.last_sign_in_at)}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setDialog({ mode: 'edit', user: u })}>
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isSelf}
                              title={isSelf ? 'Você não pode remover o próprio acesso.' : undefined}
                              onClick={() => setDialog({ mode: 'delete', user: u })}
                            >
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {dialog?.mode === 'create' && (
        <UserFormModal
          title="Novo usuário"
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); void load(); }}
        />
      )}

      {dialog?.mode === 'edit' && (
        <UserFormModal
          title="Editar usuário"
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); void load(); }}
        />
      )}

      {dialog?.mode === 'delete' && (
        <DeleteUserModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDeleted={() => { setDialog(null); void load(); }}
        />
      )}
    </>
  );
}

interface FormModalProps {
  title: string;
  user?: StaffUser;
  onClose: () => void;
  onSaved: () => void;
}

function UserFormModal({ title, user, onClose, onSaved }: FormModalProps) {
  const isEdit = Boolean(user);
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && user) {
        const payload: { email?: string; password?: string } = {};
        if (email.trim() && email.trim() !== user.email) payload.email = email.trim();
        if (password) payload.password = password;
        if (payload.email === undefined && payload.password === undefined) {
          setError('Altere o e-mail ou defina uma nova senha.');
          setSubmitting(false);
          return;
        }
        await updateUser(user.id, payload);
      } else {
        await createUser({ email: email.trim(), password });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o usuário.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} closeDisabled={submitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="user-email">
          <TextInput
            id="user-email"
            type="email"
            autoComplete="off"
            required={!isEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operador@campo.com"
          />
        </Field>

        <Field label={isEdit ? 'Nova senha' : 'Senha'} htmlFor="user-password" hint={isEdit ? '(deixe em branco para manter)' : '(mín. 8 caracteres)'}>
          <TextInput
            id="user-password"
            type="password"
            autoComplete="new-password"
            required={!isEdit}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface DeleteModalProps {
  user: StaffUser;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteUserModal({ user, onClose, onDeleted }: DeleteModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteUser(user.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível remover o usuário.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Remover usuário" onClose={onClose} closeDisabled={submitting}>
      <p className="text-sm leading-6 text-on-surface-variant">
        Tem certeza que deseja remover o acesso de <span className="font-semibold text-on-surface">{user.email}</span>?
        Esta ação não pode ser desfeita.
      </p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button type="button" variant="danger" onClick={() => void handleDelete()} disabled={submitting}>
          {submitting ? 'Removendo…' : 'Remover'}
        </Button>
      </div>
    </Modal>
  );
}
