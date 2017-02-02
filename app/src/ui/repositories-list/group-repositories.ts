import { Repository } from '../../models/repository'
import { getDotComAPIEndpoint } from '../../lib/api'
import { CloningRepository } from '../../lib/dispatcher'
import { caseInsenstiveCompare } from '../../lib/compare'
import { IFoldoutListGroup, IFoldoutListItem } from '../lib/foldout-list'

export type RepositoryGroupIdentifier = 'github' | 'enterprise' | 'other'

export type Repositoryish = Repository | CloningRepository

export interface IRepositoryListItem extends IFoldoutListItem {
  readonly text: string
  readonly id: string
  readonly repository: Repositoryish
}

export function groupRepositories(repositories: ReadonlyArray<Repositoryish>): ReadonlyArray<IFoldoutListGroup<IRepositoryListItem>> {
  const grouped = new Map<RepositoryGroupIdentifier, Repositoryish[]>()
  for (const repository of repositories) {
    const gitHubRepository = repository instanceof Repository ? repository.gitHubRepository : null
    let group: RepositoryGroupIdentifier = 'other'
    if (gitHubRepository) {
      if (gitHubRepository.endpoint === getDotComAPIEndpoint()) {
        group = 'github'
      } else {
        group = 'enterprise'
      }
    } else {
      group = 'other'
    }

    let repositories = grouped.get(group)
    if (!repositories) {
      repositories = new Array<Repository>()
      grouped.set(group, repositories)
    }

    repositories.push(repository)
  }

  const groups = new Array<IFoldoutListGroup<IRepositoryListItem>>()

  const addGroup = (identifier: RepositoryGroupIdentifier) => {
    const repositories = grouped.get(identifier)
    if (!repositories || repositories.length === 0) { return }

    repositories.sort((x, y) => caseInsenstiveCompare(x.name, y.name))
    const items = repositories.map(r => ({
      text: r.name,
      id: r.id.toString(),
      repository: r,
    }))

    groups.push({ identifier, items })
  }

  // NB: This ordering reflects the order in the repositories sidebar.
  addGroup('github')
  addGroup('enterprise')
  addGroup('other')

  return groups
}
