import { useMutation } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'

import { EmbeddedHubPicker } from '@/app/capabilities/skills/embedded-hub-picker'
import { skillsQueryKey, useSkillsQuery } from '@/app/capabilities/skills/skills-data'
import { SkillsTab } from '@/app/capabilities/skills/skills-tab'
import { useToolsetsQuery } from '@/app/capabilities/toolsets/toolsets-data'
import { ToolsetsTab } from '@/app/capabilities/toolsets/toolsets-tab'
import { PanelEmpty } from '@/app/overlays/panel'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SearchField } from '@/components/ui/search-field'
import { Textarea } from '@/components/ui/textarea'
import { createProfileSkill, type ProfileScope, profileScopeKey } from '@/hermes'
import { useI18n } from '@/i18n'
import { queryClient } from '@/lib/query-client'
import { invalidateSlashCompletions } from '@/lib/slash-completion-cache'
import { OFFICIAL_SKILLS_KEY } from '@/store/hub-actions'
import { notify } from '@/store/notifications'

import { ExtensionAdvanced } from './extension-advanced'
import { skillFormCopy } from './skill-form-copy'

function CreateSkill({
  profile,
  onClose,
  onCreated
}: {
  profile: ProfileScope
  onClose(): void
  onCreated(name: string): void
}) {
  const { locale, t } = useI18n()
  const copy = skillFormCopy[locale]
  const hintId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')

  const save = useMutation({
    mutationFn: () => createProfileSkill(profile, name.trim(), description.trim(), instructions.trim()),
    onSuccess: () => {
      // Keep the captured owner's cache current even if the user changed Bit
      // while the request was pending.
      void queryClient.invalidateQueries({ queryKey: skillsQueryKey(profile) })
      invalidateSlashCompletions()
      notify({ kind: 'success', title: t.skills.skillUpdated, message: name })
      onCreated(name.trim())
    }
  })

  return (
    <Dialog
      onOpenChange={open => {
        if (!open && !save.isPending) {
          onClose()
        }
      }}
      open
    >
      <DialogContent className="max-w-md" fitContent>
        <DialogTitle>{copy.create}</DialogTitle>
        <DialogDescription>
          {t.skills.configuringProfile} {profileScopeKey(profile)}
        </DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={event => {
            event.preventDefault()

            if (!save.isPending && name.trim() && description.trim() && instructions.trim()) {
              save.mutate()
            }
          }}
        >
          <label className="grid gap-1 text-sm">
            {t.connectorsPage.add.name}
            <Input
              aria-describedby={hintId}
              maxLength={64}
              onChange={event => setName(event.target.value)}
              pattern="[a-z0-9][a-z0-9._\-]*"
              required
              value={name}
            />
          </label>
          <p className="text-xs text-(--ui-text-tertiary)" id={hintId}>
            {copy.nameHint}
          </p>
          <label className="grid gap-1 text-sm">
            {t.webhooks.fieldDescription}
            <Input maxLength={60} onChange={event => setDescription(event.target.value)} required value={description} />
          </label>
          <label className="grid gap-1 text-sm">
            {copy.instructions}
            <Textarea onChange={event => setInstructions(event.target.value)} required rows={5} value={instructions} />
          </label>
          {save.isError && (
            <p className="text-sm text-destructive" role="alert">
              {save.error instanceof Error ? save.error.message : t.common.failed}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button disabled={save.isPending} onClick={onClose} size="sm" type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button
              disabled={save.isPending || !description.trim() || !instructions.trim() || !name.trim()}
              size="sm"
              type="submit"
            >
              {save.isPending ? t.common.saving : copy.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SkillToolsets({ profile }: { profile: ProfileScope }) {
  const { t } = useI18n()
  const toolsets = useToolsetsQuery(profile)
  const [query, setQuery] = useState('')

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{t.skills.tabToolsets}</h3>
      <SearchField
        aria-label={t.skills.searchToolsets}
        onChange={setQuery}
        placeholder={t.skills.searchToolsets}
        value={query}
      />
      {toolsets.data ? (
        <div className="h-64">
          <ToolsetsTab profile={profile} query={query} toolsets={toolsets.data} />
        </div>
      ) : toolsets.isError ? (
        <Button onClick={() => void toolsets.refetch()} size="sm" variant="text">
          {t.common.retry}
        </Button>
      ) : (
        <PageLoader label={t.skills.loading} />
      )}
    </section>
  )
}

export function ExtensionSkills({ initialSkill, profile }: { initialSkill: string; profile: ProfileScope }) {
  const { t, locale } = useI18n()
  const skills = useSkillsQuery(profile)
  const installedNames = useMemo(() => new Set((skills.data ?? []).map(skill => skill.name)), [skills.data])
  const [query, setQuery] = useState(initialSkill)
  const [create, setCreate] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: skillsQueryKey(profile) })
    void queryClient.invalidateQueries({ queryKey: [...OFFICIAL_SKILLS_KEY, profileScopeKey(profile)] })
    invalidateSlashCompletions()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="min-w-32 flex-1" data-tour="skill-search">
          <SearchField
            aria-label={t.skills.searchSkills}
            onChange={setQuery}
            placeholder={t.skills.searchSkills}
            value={query}
          />
        </div>
        <Button onClick={() => setCreate(true)} size="sm" variant="outline">
          {skillFormCopy[locale].create}
        </Button>
      </div>
      <div className="min-h-32 flex-1 overflow-hidden">
        {skills.data ? (
          <SkillsTab
            advanced={advanced}
            groupAdvanced
            initialSkill={initialSkill}
            onRefresh={refresh}
            profile={profile}
            query={query}
            skills={skills.data}
          />
        ) : skills.isError ? (
          <PanelEmpty
            action={
              <Button onClick={refresh} size="sm">
                {t.common.retry}
              </Button>
            }
            icon="error"
            title={t.skills.skillsLoadFailed}
          />
        ) : (
          <PageLoader label={t.skills.loading} />
        )}
      </div>
      <EmbeddedHubPicker installedNames={installedNames} profile={profile} />
      <div className="max-h-[40vh] shrink-0 overflow-y-auto">
        <ExtensionAdvanced onOpenChange={setAdvanced}>
          <SkillToolsets profile={profile} />
        </ExtensionAdvanced>
      </div>
      {create && (
        <CreateSkill
          onClose={() => setCreate(false)}
          onCreated={name => {
            setQuery(name)
            setCreate(false)
          }}
          profile={profile}
        />
      )}
    </div>
  )
}
