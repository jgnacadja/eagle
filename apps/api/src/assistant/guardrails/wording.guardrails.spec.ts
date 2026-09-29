import type { AssistantRecommendation, AssistantReply } from '@learnup/types'
import {
  ASSISTANT_NOTICE,
  SOURCE_MENTION,
  applyWordingGuardrails,
  guardReply,
  sanitizeJustification
} from './wording.guardrails'

function recommendation(
  slug: string,
  justification: string,
  rank: AssistantRecommendation['rank'] = 'alternative'
): AssistantRecommendation {
  return {
    slug,
    familySlug: 'management',
    title: slug.toUpperCase(),
    description: null,
    durationDays: 2,
    durationHours: null,
    modalities: ['presentiel'],
    certification: null,
    rank,
    justification,
    availability: null,
    url: `/formations/management/${slug}`
  }
}

describe('sanitizeJustification', () => {
  it('keeps a compliant conditional justification untouched', () => {
    const text =
      "Cette formation semble adaptée à votre besoin parce qu'elle s'adresse aux managers."
    expect(sanitizeJustification(text)).toEqual({ text, issues: [] })
  })

  it('rewrites assertive wording into the conditional', () => {
    expect(
      sanitizeJustification('Cette formation est parfaitement adaptée à vos managers.')
    ).toEqual({
      text: 'Cette formation semble adaptée à vos managers.',
      issues: ['assertive-wording']
    })
    expect(sanitizeJustification("C'est la formation qu'il vous faut pour vos équipes.").text).toBe(
      'Cette formation semble correspondre à votre besoin.'
    )
    expect(
      sanitizeJustification('Elle répond à votre besoin et vous permettra de progresser.').text
    ).toBe('Elle semble répondre à votre besoin et devrait vous permettre de progresser.')
  })

  it('softens regulatory promises', () => {
    const { text, issues } = sanitizeJustification(
      'Elle vous garantit une certification et vous serez conforme à la réglementation.'
    )

    expect(issues).toContain('regulatory-promise')
    expect(text).not.toMatch(/garantit|serez conforme/)
    expect(text).toContain('vise à vous apporter')
  })

  it('keeps two sentences at most and frames a bare statement in the conditional', () => {
    const { text, issues } = sanitizeJustification('Phrase une. Phrase deux. Phrase trois.')
    expect(text).toBe('Cette formation semble adaptée à votre besoin : phrase une. Phrase deux.')
    expect(issues).toEqual(['too-long', 'assertive-wording'])

    expect(sanitizeJustification('').text).toBe('')
  })
})

describe('applyWordingGuardrails', () => {
  it('sanitizes every justification, dedupes courses and caps to one primary and two alternatives', () => {
    const { recommendations, issues } = applyWordingGuardrails([
      recommendation('a', 'Cette formation est adaptée à votre besoin.', 'primary'),
      recommendation('b', 'Semble pertinente si votre besoin porte sur la posture.'),
      recommendation('a', 'Doublon de la principale.'),
      recommendation('c', 'Semble utile en complément.'),
      recommendation('d', 'Une de trop.')
    ])

    expect(recommendations.map((r) => r.slug)).toEqual(['a', 'b', 'c'])
    expect(recommendations[0].justification).toBe('Cette formation semble adaptée à votre besoin.')
    expect(issues).toEqual(
      expect.arrayContaining(['assertive-wording', 'duplicate-course', 'too-many-alternatives'])
    )
  })

  it('always promotes the first kept recommendation to primary', () => {
    // Slug principal halluciné puis écarté en amont : la liste reçue ne
    // contient que des « alternatives ».
    const { recommendations, issues } = applyWordingGuardrails([
      recommendation('b', 'Semble pertinente pour vos managers.'),
      recommendation('c', 'Semble utile en complément.', 'primary')
    ])

    expect(recommendations.map((r) => r.rank)).toEqual(['primary', 'alternative'])
    expect(issues).toEqual([])
  })
})

describe('guardReply', () => {
  it('adds the automated-assistant notice to every reply', () => {
    const reply: AssistantReply = { kind: 'clarify', text: 'Précisez.', question: 'Quel risque ?' }

    expect(guardReply(reply)).toEqual({
      reply: { ...reply, notice: ASSISTANT_NOTICE },
      issues: []
    })
    expect(ASSISTANT_NOTICE).toContain('assistant automatisé')
    expect(guardReply({ kind: 'no_results', text: 'Rien.', recommendations: [] }).reply).toEqual({
      kind: 'no_results',
      text: 'Rien.',
      recommendations: [],
      notice: ASSISTANT_NOTICE
    })
  })

  it('guards the recommendations and cites the source', () => {
    const { reply, issues } = guardReply({
      kind: 'recommend',
      text: 'Nous vous recommandons',
      recommendations: [recommendation('a', 'Elle vous garantit la certification.', 'primary')]
    })

    expect(reply.source).toBe(SOURCE_MENTION)
    expect(reply.notice).toBe(ASSISTANT_NOTICE)
    expect(reply.recommendations?.[0].justification).not.toContain('garantit')
    expect(issues).toContain('regulatory-promise')
  })
})
