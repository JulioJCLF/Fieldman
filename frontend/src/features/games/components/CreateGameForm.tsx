import { useState } from 'react';

import { Alert, Button, Card, Field, SegmentedControl, Textarea } from '../../../components/ui';
import { ApiError, createGame, startGame } from '../api/gamesApi';
import type { Game, GameType } from '../types';

interface Props {
  onGameStarted: (game: Game) => void;
  onCancel: () => void;
}

export function CreateGameForm({ onGameStarted, onCancel }: Props) {
  const [type, setType] = useState<GameType>('OPEN');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const game = await createGame({ type, notes: notes.trim() || undefined });
      const started = await startGame(game.id);
      onGameStarted(started);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar jogo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Abrir novo jogo">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Tipo de jogo">
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: 'OPEN', label: 'Aberto' },
              { value: 'PRIVATE', label: 'Fechado' },
            ]}
          />
        </Field>

        <Field label="Observações" htmlFor="game-notes" hint="(opcional)">
          <Textarea
            id="game-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Ex: evento especial, grupos reservados…"
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Criando…' : 'Criar e iniciar'}</Button>
        </div>
      </form>
    </Card>
  );
}
