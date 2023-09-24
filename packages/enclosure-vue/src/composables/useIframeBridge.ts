import { onBeforeUnmount, onMounted, unref } from 'vue'
import { onBeforeRouteUpdate, useRouter, type RouteLocationNormalized } from 'vue-router'
import { ensureNotNil } from 'type-assurer'
import {
  createCommunicator as createCommunicatorInternal,
  type Communicator
} from '@passerelle/enclosure-core'

import type { IframeRef, IframeBridgeOption } from '../lib/types'
import { name } from '../../package.json'

function extractLogPrefix(opt: IframeBridgeOption): string {
  return opt.logPrefix ?? `[${name}]`
}

const isSSR = typeof window === 'undefined'

/**
 * 引数に iframe タグを設定することで、以下の機能を提供する
 * - iframe の src を書き換えてしまうと、ページがリロードされてしまうため、 src を書き換えずにページを遷移する
 * - iframe 内側のページ遷移を検知し、親側の history 及びページパスへ同期させる
 * @param iframeRef
 * @param opt
 * @return
 */
export function useIframeBridge(iframeRef: IframeRef, opt: IframeBridgeOption) {
  if (isSSR) return

  const { toChildPath: _a, toParentPath, ...config } = opt

  const router = useRouter()

  let communicator: Communicator | undefined = undefined

  onMounted(() => {
    communicator = createCommunicatorInternal(ensureNotNil(unref(iframeRef)), {
      logPrefix: extractLogPrefix(opt),
      ...config
    })

    communicator!.hooks.on('navigate', (value) => {
      router.replace(toParentPath(value))
    })
  })

  onBeforeRouteUpdate((to, from, next) => {
    if (isSamePathTransition(to, from)) {
      syncHashParentToChild(to, ensureNotNil(communicator), opt)
    }
    return next()
  })

  onBeforeUnmount(() => {
    communicator?.destroy()
  })
}

function isSamePathTransition(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  return to.name === from.name && to.path !== from.path
}

function syncHashParentToChild(
  location: RouteLocationNormalized,
  communicator: Communicator,
  opt: IframeBridgeOption
) {
  const logPrefix = extractLogPrefix(opt)
  const loggerFeatureKey = 'observer (parent) : sync parent -> child :'
  const path = opt.toChildPath(location)

  if (!path) {
    console.warn(logPrefix, loggerFeatureKey, `path is not found. (inputs: ${path})`)
    return
  }

  console.debug(logPrefix, loggerFeatureKey, `(path: ${path})`)
  communicator.navigate({
    path
  })
}
