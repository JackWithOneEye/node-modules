export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neutral',
    },
    tooltip: {
      slots: {
        content: 'flex items-center gap-1 bg-default text-highlighted shadow-sm rounded-sm ring ring-default h-6 px-2.5 py-1 text-sm font-mono select-none data-[state=delayed-open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] origin-(--reka-tooltip-content-transform-origin) pointer-events-auto',
      },
    },
    dropdownMenu: {
      variants: {
        active: {
          false: {
            itemLeadingIcon: 'group-data-[state=open]:!text-neutral-400',
          },
          true: {
            itemLeadingIcon: '!text-neutral-400',
          },
        },
      },
    },
  },
})
