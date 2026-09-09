import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/*
  Magic UI — Bento Grid  (https://magicui.design/docs/components/bento-grid)
  Installed with `npx shadcn@latest add @magicui/bento-grid`, then adapted for CareOS:
    - `@radix-ui/react-icons` ArrowRightIcon  →  lucide-react ArrowRight (CareOS icon system)
    - shadcn <Button asChild><a href>           →  react-router <Link> (no full-page reload,
      no radix-ui / class-variance-authority dependency just for one link)
    - `children` slot added to BentoCard so cards can render real content (stat, list, table)
      instead of only a decorative `background`.
    - The header no longer lifts on hover (`lg:group-hover:-translate-y-10`): in the demo the
      header sits over empty space, here real content sits under it and would be overlapped.
  Grid/Card class names, structure, hover reveal of the CTA and the sizing conventions
  (`col-span-*` / `row-span-*` / `lg:` breakpoints) are the Magic UI originals.
*/

const BentoGrid = ({ children, className, ...props }) => (
  <div
    className={cn('grid w-full auto-rows-[22rem] grid-cols-3 gap-4', className)}
    {...props}
  >
    {children}
  </div>
);

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
  ...props
}) => (
  <div
    key={name}
    className={cn(
      'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl',
      // light styles
      'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
      // dark styles
      'dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
      className,
    )}
    {...props}
  >
    <div>{background}</div>
    <div className="flex flex-1 flex-col p-4">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300">
        {Icon && (
          <Icon className="h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
        )}
        <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300">{name}</h3>
        {description && <p className="max-w-lg text-sm text-neutral-400">{description}</p>}
      </div>

      {children}

      {href && (
        <div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden">
          <Link to={href} className="pointer-events-auto inline-flex items-center gap-2 p-0 text-sm font-medium text-brand hover:underline underline-offset-4">
            {cta}
            <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      )}
    </div>

    {href && (
      <div className="pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
        <Link to={href} className="pointer-events-auto inline-flex items-center gap-2 p-0 text-sm font-medium text-brand hover:underline underline-offset-4">
          {cta}
          <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    )}

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/3 group-hover:dark:bg-neutral-800/10" />
  </div>
);

export { BentoCard, BentoGrid };
