<template>
	<page-view-layout>
		<template #aside v-if="showAside">
			<div :class="[$style['heading-wrapper'], 'mb-xs']">
				<n8n-heading size="2xlarge">
					{{ i18n.baseText(`${resourceKey}.heading`) }}
				</n8n-heading>
			</div>

			<div class="mt-xs mb-l">
				<slot name="add-button" :disabled="disabled">
					<n8n-button
						size="large"
						block
						:disabled="disabled"
						@click="$emit('click:add', $event)"
						data-test-id="resources-list-add"
					>
						{{ i18n.baseText(`${resourceKey}.add`) }}
					</n8n-button>
				</slot>
			</div>

			<enterprise-edition :features="[EnterpriseEditionFeature.Sharing]" v-if="shareable">
				<resource-ownership-select
					v-model="isOwnerSubview"
					:my-resources-label="i18n.baseText(`${resourceKey}.menu.my`)"
					:all-resources-label="i18n.baseText(`${resourceKey}.menu.all`)"
				/>
			</enterprise-edition>
		</template>

		<div v-if="loading">
			<n8n-loading :class="[$style['header-loading'], 'mb-l']" variant="custom" />
			<n8n-loading :class="[$style['card-loading'], 'mb-2xs']" variant="custom" />
			<n8n-loading :class="$style['card-loading']" variant="custom" />
		</div>
		<template v-else>
			<div v-if="resources.length === 0">
				<slot name="empty">
					<n8n-action-box
						data-test-id="empty-resources-list"
						emoji="👋"
						:heading="
							i18n.baseText(
								usersStore.currentUser.firstName
									? `${resourceKey}.empty.heading`
									: `${resourceKey}.empty.heading.userNotSetup`,
								{
									interpolate: { name: usersStore.currentUser.firstName },
								},
							)
						"
						:description="i18n.baseText(`${resourceKey}.empty.description`)"
						:buttonText="i18n.baseText(`${resourceKey}.empty.button`)"
						buttonType="secondary"
						@click:button="$emit('click:add', $event)"
					/>
				</slot>
			</div>
			<page-view-layout-list :overflow="type !== 'list'" v-else>
				<template #header>
					<div class="mb-xs">
						<div :class="$style['filters-row']">
							<n8n-input
								:modelValue="filtersModel.search"
								:class="[$style['search'], 'mr-2xs']"
								:placeholder="i18n.baseText(`${resourceKey}.search.placeholder`)"
								clearable
								ref="search"
								data-test-id="resources-list-search"
								@update:modelValue="onSearch"
							>
								<template #prefix>
									<n8n-icon icon="search" />
								</template>
							</n8n-input>
							<div :class="$style['sort-and-filter']">
								<n8n-select v-model="sortBy" data-test-id="resources-list-sort">
									<n8n-option
										v-for="sortOption in sortOptions"
										data-test-id="resources-list-sort-item"
										:key="sortOption"
										:value="sortOption"
										:label="i18n.baseText(`${resourceKey}.sort.${sortOption}`)"
									/>
								</n8n-select>
								<resource-filters-dropdown
									v-if="showFiltersDropdown"
									:keys="filterKeys"
									:reset="resetFilters"
									:modelValue="filtersModel"
									:shareable="shareable"
									@update:modelValue="$emit('update:filters', $event)"
									@update:filtersLength="onUpdateFiltersLength"
								>
									<template #default="resourceFiltersSlotProps">
										<slot name="filters" v-bind="resourceFiltersSlotProps" />
									</template>
								</resource-filters-dropdown>
							</div>
						</div>
					</div>

					<slot name="callout"></slot>

					<div v-if="showFiltersDropdown" v-show="hasFilters" class="mt-xs">
						<n8n-info-tip :bold="false">
							{{ i18n.baseText(`${resourceKey}.filters.active`) }}
							<n8n-link data-test-id="workflows-filter-reset" @click="resetFilters" size="small">
								{{ i18n.baseText(`${resourceKey}.filters.active.reset`) }}
							</n8n-link>
						</n8n-info-tip>
					</div>

					<div class="pb-xs" />
				</template>

				<slot name="preamble" />

				<div
					v-if="filteredAndSortedSubviewResources.length > 0"
					:class="$style.listWrapper"
					ref="listWrapperRef"
				>
					<n8n-recycle-scroller
						v-if="type === 'list'"
						data-test-id="resources-list"
						:class="[$style.list, 'list-style-none']"
						:items="filteredAndSortedSubviewResources"
						:item-size="typeProps.itemSize"
						item-key="id"
					>
						<template #default="{ item, updateItemSize }">
							<slot :data="item" :updateItemSize="updateItemSize" />
						</template>
						<template #postListContent>
							<slot name="postListContent" />
						</template>
					</n8n-recycle-scroller>
					<n8n-datatable
						v-if="typeProps.columns"
						data-test-id="resources-table"
						:class="$style.datatable"
						:columns="typeProps.columns"
						:rows="filteredAndSortedSubviewResources"
						:currentPage="currentPage"
						:rowsPerPage="rowsPerPage"
						@update:currentPage="setCurrentPage"
						@update:rowsPerPage="setRowsPerPage"
					>
						<template #row="{ columns, row }">
							<slot :data="row" :columns="columns" />
						</template>
					</n8n-datatable>
				</div>

				<n8n-text color="text-base" size="medium" data-test-id="resources-list-empty" v-else>
					{{ i18n.baseText(`${resourceKey}.noResults`) }}
					<template v-if="shouldSwitchToAllSubview">
						<span v-if="!filtersModel.search">
							({{ i18n.baseText(`${resourceKey}.noResults.switchToShared.preamble`) }}
							<n8n-link @click="setOwnerSubview(false)">
								{{ i18n.baseText(`${resourceKey}.noResults.switchToShared.link`) }} </n8n-link
							>)
						</span>

						<span v-else>
							({{ i18n.baseText(`${resourceKey}.noResults.withSearch.switchToShared.preamble`) }}
							<n8n-link @click="setOwnerSubview(false)">
								{{
									i18n.baseText(`${resourceKey}.noResults.withSearch.switchToShared.link`)
								}} </n8n-link
							>)
						</span>
					</template>
				</n8n-text>

				<slot name="postamble" />
			</page-view-layout-list>
		</template>
	</page-view-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { mapStores } from 'pinia';

import type { IUser } from '@/Interface';
import PageViewLayout from '@/components/layouts/PageViewLayout.vue';
import PageViewLayoutList from '@/components/layouts/PageViewLayoutList.vue';
import { EnterpriseEditionFeature } from '@/constants';
import { debounceHelper } from '@/mixins/debounce';
import ResourceOwnershipSelect from '@/components/forms/ResourceOwnershipSelect.ee.vue';
import ResourceFiltersDropdown from '@/components/forms/ResourceFiltersDropdown.vue';
import { useSettingsStore } from '@/stores/settings.store';
import { useUsersStore } from '@/stores/users.store';
import type { N8nInput, DatatableColumn } from 'n8n-design-system';
import { useI18n } from '@/composables/useI18n';

export interface IResource {
	id: string;
	name: string;
	updatedAt: string;
	createdAt: string;
	ownedBy?: Partial<IUser>;
	sharedWith?: Array<Partial<IUser>>;
}

interface IFilters {
	search: string;
	ownedBy: string;
	sharedWith: string;

	[key: string]: boolean | string | string[];
}

type IResourceKeyType = 'credentials' | 'workflows';
type SearchRef = InstanceType<typeof N8nInput>;

export default defineComponent({
	name: 'resources-list-layout',
	mixins: [debounceHelper],
	components: {
		PageViewLayout,
		PageViewLayoutList,
		ResourceOwnershipSelect,
		ResourceFiltersDropdown,
	},
	props: {
		resourceKey: {
			type: String,
			default: '' as IResourceKeyType,
		},
		displayName: {
			type: Function as PropType<(resource: IResource) => string>,
			default: (resource: IResource) => resource.name,
		},
		resources: {
			type: Array,
			default: (): IResource[] => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		initialize: {
			type: Function as PropType<() => Promise<void>>,
			default: () => async () => {},
		},
		filters: {
			type: Object,
			default: (): IFilters => ({ search: '', ownedBy: '', sharedWith: '' }),
		},
		additionalFiltersHandler: {
			type: Function,
		},
		showAside: {
			type: Boolean,
			default: true,
		},
		shareable: {
			type: Boolean,
			default: true,
		},
		showFiltersDropdown: {
			type: Boolean,
			default: true,
		},
		sortFns: {
			type: Object as PropType<Record<string, (a: IResource, b: IResource) => number>>,
			default: (): Record<string, (a: IResource, b: IResource) => number> => ({}),
		},
		sortOptions: {
			type: Array as PropType<string[]>,
			default: () => ['lastUpdated', 'lastCreated', 'nameAsc', 'nameDesc'],
		},
		type: {
			type: String as PropType<'datatable' | 'list'>,
			default: 'list',
		},
		typeProps: {
			type: Object as PropType<{ itemSize: number } | { columns: DatatableColumn[] }>,
			default: () => ({
				itemSize: 80,
			}),
		},
	},
	setup() {
		const i18n = useI18n();

		return {
			i18n,
		};
	},
	data() {
		return {
			loading: true,
			isOwnerSubview: false,
			sortBy: this.sortOptions[0],
			hasFilters: false,
			filtersModel: { ...this.filters },
			currentPage: 1,
			rowsPerPage: 10 as number | '*',
			resettingFilters: false,
			EnterpriseEditionFeature,
		};
	},
	computed: {
		...mapStores(useSettingsStore, useUsersStore),
		subviewResources(): IResource[] {
			if (!this.shareable) {
				return this.resources as IResource[];
			}

			return (this.resources as IResource[]).filter((resource) => {
				if (
					this.isOwnerSubview &&
					this.settingsStore.isEnterpriseFeatureEnabled(EnterpriseEditionFeature.Sharing)
				) {
					return !!(resource.ownedBy && resource.ownedBy.id === this.usersStore.currentUser?.id);
				}

				return true;
			});
		},
		filterKeys(): string[] {
			return Object.keys(this.filtersModel);
		},
		filteredAndSortedSubviewResources(): IResource[] {
			const filtered: IResource[] = this.subviewResources.filter((resource: IResource) => {
				let matches = true;

				if (this.filtersModel.ownedBy) {
					matches =
						matches && !!(resource.ownedBy && resource.ownedBy.id === this.filtersModel.ownedBy);
				}

				if (this.filtersModel.sharedWith) {
					matches =
						matches &&
						!!resource.sharedWith?.find((sharee) => sharee.id === this.filtersModel.sharedWith);
				}

				if (this.filtersModel.search) {
					const searchString = this.filtersModel.search.toLowerCase();

					matches = matches && this.displayName(resource).toLowerCase().includes(searchString);
				}

				if (this.additionalFiltersHandler) {
					matches = this.additionalFiltersHandler(resource, this.filtersModel, matches);
				}

				return matches;
			});

			return filtered.sort((a, b) => {
				switch (this.sortBy) {
					case 'lastUpdated':
						return this.sortFns.lastUpdated
							? this.sortFns.lastUpdated(a, b)
							: new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
					case 'lastCreated':
						return this.sortFns.lastCreated
							? this.sortFns.lastCreated(a, b)
							: new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();
					case 'nameAsc':
						return this.sortFns.nameAsc
							? this.sortFns.nameAsc(a, b)
							: this.displayName(a).trim().localeCompare(this.displayName(b).trim());
					case 'nameDesc':
						return this.sortFns.nameDesc
							? this.sortFns.nameDesc(a, b)
							: this.displayName(b).trim().localeCompare(this.displayName(a).trim());
					default:
						return this.sortFns[this.sortBy] ? this.sortFns[this.sortBy](a, b) : 0;
				}
			});
		},
		resourcesNotOwned(): IResource[] {
			return (this.resources as IResource[]).filter((resource) => {
				return resource.ownedBy && resource.ownedBy.id !== this.usersStore.currentUser?.id;
			});
		},
		shouldSwitchToAllSubview(): boolean {
			return !this.hasFilters && this.isOwnerSubview && this.resourcesNotOwned.length > 0;
		},
	},
	methods: {
		async onMounted() {
			await this.initialize();

			this.loading = false;
			await this.$nextTick();
			this.focusSearchInput();

			if (this.hasAppliedFilters()) {
				this.hasFilters = true;
			}
		},
		hasAppliedFilters(): boolean {
			return !!this.filterKeys.find(
				(key) =>
					key !== 'search' &&
					(Array.isArray(this.filters[key])
						? this.filters[key].length > 0
						: this.filters[key] !== ''),
			);
		},
		setCurrentPage(page: number) {
			this.currentPage = page;
		},
		setRowsPerPage(rowsPerPage: number | '*') {
			this.rowsPerPage = rowsPerPage;
		},
		resetFilters() {
			Object.keys(this.filtersModel).forEach((key) => {
				this.filtersModel[key] = Array.isArray(this.filtersModel[key]) ? [] : '';
			});

			this.resettingFilters = true;
			this.sendFiltersTelemetry('reset');
		},
		focusSearchInput() {
			if (this.$refs.search) {
				(this.$refs.search as SearchRef).focus();
			}
		},
		setOwnerSubview(active: boolean) {
			this.isOwnerSubview = active;
		},
		getTelemetrySubview(): string {
			return this.i18n.baseText(
				`${this.resourceKey as IResourceKeyType}.menu.${this.isOwnerSubview ? 'my' : 'all'}`,
			);
		},
		sendSubviewTelemetry() {
			this.$telemetry.track(`User changed ${this.resourceKey} sub view`, {
				sub_view: this.getTelemetrySubview(),
			});
		},
		sendSortingTelemetry() {
			this.$telemetry.track(`User changed sorting in ${this.resourceKey} list`, {
				sub_view: this.getTelemetrySubview(),
				sorting: this.sortBy,
			});
		},
		sendFiltersTelemetry(source: string) {
			// Prevent sending multiple telemetry events when resetting filters
			// Timeout is required to wait for search debounce to be over
			if (this.resettingFilters) {
				if (source !== 'reset') {
					return;
				}

				setTimeout(() => (this.resettingFilters = false), 1500);
			}

			const filters = this.filtersModel as Record<string, string[] | string | boolean>;
			const filtersSet: string[] = [];
			const filterValues: Array<string[] | string | boolean | null> = [];

			Object.keys(filters).forEach((key) => {
				if (filters[key]) {
					filtersSet.push(key);
					filterValues.push(key === 'search' ? null : filters[key]);
				}
			});

			this.$telemetry.track(`User set filters in ${this.resourceKey} list`, {
				filters_set: filtersSet,
				filter_values: filterValues,
				sub_view: this.getTelemetrySubview(),
				[`${this.resourceKey}_total_in_view`]: this.subviewResources.length,
				[`${this.resourceKey}_after_filtering`]: this.filteredAndSortedSubviewResources.length,
			});
		},
		onUpdateFiltersLength(length: number) {
			this.hasFilters = length > 0;
		},
		onSearch(search: string) {
			this.filtersModel.search = search;
			this.$emit('update:filters', this.filtersModel);
		},
	},
	mounted() {
		void this.onMounted();
	},
	watch: {
		isOwnerSubview() {
			this.sendSubviewTelemetry();
		},
		filters(value) {
			this.filtersModel = value;
		},
		'filtersModel.ownedBy'(value) {
			if (value) {
				this.setOwnerSubview(false);
			}
			this.sendFiltersTelemetry('ownedBy');
		},
		'filtersModel.sharedWith'() {
			this.sendFiltersTelemetry('sharedWith');
		},
		'filtersModel.search'() {
			void this.callDebounced(
				'sendFiltersTelemetry',
				{ debounceTime: 1000, trailing: true },
				'search',
			);
		},
		sortBy(newValue) {
			this.$emit('sort', newValue);
			this.sendSortingTelemetry();
		},
	},
});
</script>

<style lang="scss" module>
.heading-wrapper {
	padding-bottom: 1px; // Match input height
}

.filters-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.search {
	max-width: 240px;
}

.list {
	//display: flex;
	//flex-direction: column;
}

.listWrapper {
	height: 100%;
}

.sort-and-filter {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.header-loading {
	height: 36px;
}

.card-loading {
	height: 69px;
}

.datatable {
	padding-bottom: var(--spacing-s);
}
</style>
