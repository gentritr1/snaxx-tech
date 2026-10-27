import { Mail } from 'lucide-react';
import { contactConfig } from '@/config';
import { AnimatedButton } from '@/components/AnimatedButton';
import { Chapter } from './Chapter';

export function ContactChapter() {
  return (
    <Chapter id="contact" height="130vh" align="center" fadeIn={0.18} fadeOutAt={1}>
      <div className="copy-scrim max-w-2xl">
        <h2 className="font-display type-headline text-ink">{contactConfig.heading}</h2>
        <p className="type-lead mx-auto mt-5 max-w-lg">{contactConfig.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AnimatedButton href={`mailto:${contactConfig.email}`} variant="primary" size="lg">
            {contactConfig.buttonText}
          </AnimatedButton>
          <a
            href={`mailto:${contactConfig.email}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-ink/75 transition-colors hover:text-ink"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {contactConfig.email}
          </a>
        </div>
      </div>
    </Chapter>
  );
}
