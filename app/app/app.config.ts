export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neutral',
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
