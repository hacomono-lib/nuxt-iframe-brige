import { inject, watch } from 'vue'
import { type LayoutMetrix } from '@passerelle/core';

import { LAYOUT_KEY, COMMUNICATOR_KEY } from "./communicator";
import type { Communicator } from '@passerelle/insider-core';

export function onUpdateLayout(callback: (value: LayoutMetrix) => void | Promise<void>): void {
  const layout = inject(LAYOUT_KEY)
  if (!layout) return

  watch(layout, callback)
}

export function useCommunicator(): Communicator {
  const communicator = inject(COMMUNICATOR_KEY)
  if (!communicator) throw new Error('passerelle insider is not installed')

  return communicator
}
