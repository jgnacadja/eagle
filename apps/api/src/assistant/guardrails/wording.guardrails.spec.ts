import type { AssistantRecommendation, AssistantRecommendationSet } from '@learnup/types'
import {
  ASSISTANT_NOTICE,
  SOURCE_MENTION,
  applyWordingGuardrails,
  sanitizeJustification
} from './wording.guardrails'

function recommendation(slug: string, justification: string): AssistantRecommendation {
  return {
    course: { title: slug.toUpperCase(), slug, familySlug: 'management' },
    justification,
    attributes: [],
    availability: null
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
  const set: AssistantRecommendationSet = {
    principal: recommendation('a', 'Cette formation est adaptée à votre besoin.'),
    alternatives: [
      recommendation('b', 'Semble pertinente si votre besoin porte sur la posture.'),
      recommendation('a', 'Doublon de la principale.'),
      recommendation('c', 'Semble utile en complément.'),
      recommendation('d', 'Une de trop.')
    ],
    source: 'source non conforme'
  }

  it('sanitizes every justification, dedupes courses, caps alternatives and forces the source', () => {
    const { set: result, issues } = applyWordingGuardrails(set)

    expect(result.principal.justification).toBe('Cette formation semble adaptée à votre besoin.')
    expect(result.alternatives.map((a) => a.course.slug)).toEqual(['b', 'c'])
    expect(result.source).toBe(SOURCE_MENTION)
    expect(issues).toEqual(
      expect.arrayContaining(['assertive-wording', 'duplicate-course', 'too-many-alternatives'])
    )
    expect(ASSISTANT_NOTICE).toContain('assistant automatisé')
  })
})
