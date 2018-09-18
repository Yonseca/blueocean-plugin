import React, { Component, PropTypes } from 'react';
import { CommitId, ReadableDate, WeatherIcon, TableRow, TableCell } from '@jenkins-cd/design-language';
import { LiveStatusIndicator, RunButton } from '@jenkins-cd/blueocean-core-js';
import { PipelineEditorLink } from '@jenkins-cd/blueocean-pipeline-editor';
import { observer } from 'mobx-react';

import RunMessageCell from './RunMessageCell';
import { UrlBuilder } from '@jenkins-cd/blueocean-core-js';
import RunHistoryButton from './RunHistoryButton';
import { FavoritePipeline } from '../favorites/components/FavoritePipeline';

function noRun(branch, openRunDetails, t, store, columns) {
    const cleanBranchName = decodeURIComponent(branch.name);
    const statusIndicator = <LiveStatusIndicator result="NOT_BUILT" />;
    const actions = [
        <RunButton className="icon-button" runnable={branch} onNavigation={openRunDetails} />,
        <div className="jenkins-pipeline-branches-list-action">
            <PipelineEditorLink pipeline={branch} store={this.context.store} {...t} />
        </div>,
        <FavoritePipeline pipeline={branch} {...t} />,
    ];

    return <BranchDetailsRowRenderer columns={columns} branchName={cleanBranchName} statusIndicator={statusIndicator} actions={actions} />;
}

export class BranchDetailsRowRenderer extends Component {
    render() {
        const {
            branchName,
            runDetailsUrl,
            weatherScore,
            statusIndicator,
            commitId,
            runMessage,
            completed,
            actions = [],
            latestRunId,
            ...restProps
        } = this.props;

        const dataProps = {
            'data-branch': branchName,
        };

        if (latestRunId != null) {
            dataProps['data-runid'] = latestRunId;
        }

        return (
            <TableRow useRollover={!!runDetailsUrl} {...dataProps} {...restProps}>
                <TableCell linkTo={runDetailsUrl}>{weatherScore != null && <WeatherIcon score={weatherScore} />}</TableCell>
                <TableCell linkTo={runDetailsUrl}>{statusIndicator}</TableCell>
                <TableCell linkTo={runDetailsUrl}>
                    <span className="text-with-ellipsis-container">{branchName}</span>
                </TableCell>
                <TableCell linkTo={runDetailsUrl}>
                    <CommitId commitId={commitId} />
                </TableCell>
                <TableCell>{runMessage}</TableCell>
                <TableCell linkTo={runDetailsUrl}>{completed}</TableCell>
                <TableCell className="TableCell--actions">{actions}</TableCell>
            </TableRow>
        );
    }
}

BranchDetailsRowRenderer.propTypes = {
    branchName: PropTypes.string,
    runDetailsUrl: PropTypes.string,
    weatherScore: PropTypes.number,
    statusIndicator: PropTypes.node,
    commitId: PropTypes.string,
    runMessage: PropTypes.node,
    completed: PropTypes.node,
    actions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    latestRunId: PropTypes.string,
};

@observer
export class BranchDetailsRow extends Component {
    static actionItemsCount = 4;

    render() {
        const { data: branch, pipeline, t, locale, columns } = this.props;

        // early out
        if (!branch || !pipeline) {
            return null;
        }

        const { router, location } = this.context;
        const openRunDetails = newUrl => {
            // TODO: Move this out of this method
            location.pathname = newUrl;
            router.push(location);
        };
        const latestRun = branch.latestRun;
        if (!latestRun) {
            return noRun(branch, openRunDetails, t, this.context.store, columns);
        }
        const cleanBranchName = decodeURIComponent(branch.name);
        const runDetailsUrl = UrlBuilder.buildRunUrl(branch.organization, pipeline.fullName, cleanBranchName, latestRun.id, 'pipeline');

        const statusIndicator = (
            <LiveStatusIndicator
                durationInMillis={latestRun.durationInMillis}
                result={latestRun.result === 'UNKNOWN' ? latestRun.state : latestRun.result}
                startTime={latestRun.startTime}
                estimatedDuration={latestRun.estimatedDurationInMillis}
            />
        );

        const runMessage = <RunMessageCell linkTo={runDetailsUrl} run={latestRun} t={t} />;

        const completed = (
            <ReadableDate
                date={latestRun.endTime}
                liveUpdate
                locale={locale}
                shortFormat={t('common.date.readable.short', { defaultValue: 'MMM DD h:mma Z' })}
                longFormat={t('common.date.readable.long', { defaultValue: 'MMM DD YYYY h:mma Z' })}
            />
        );

        const actions = (
            <div className="actions-container">
                <RunButton className="icon-button" runnable={branch} latestRun={branch.latestRun} onNavigation={openRunDetails} />
                <RunHistoryButton pipeline={pipeline} branchName={branch.name} t={t} />
                <div className="jenkins-pipeline-branches-list-action">
                    <PipelineEditorLink pipeline={branch} {...t} />
                </div>
                <FavoritePipeline pipeline={branch} {...t} />
            </div>
        );

        return (
            <BranchDetailsRowRenderer
                columns={columns}
                runDetailsUrl={runDetailsUrl}
                branchName={cleanBranchName}
                weatherScore={branch.weatherScore}
                statusIndicator={statusIndicator}
                commitId={latestRun.commitId}
                runMessage={runMessage}
                completed={completed}
                actions={actions}
                latestRunId={latestRun.id}
            />
        );
    }
}

BranchDetailsRow.propTypes = {
    data: PropTypes.object.isRequired,
    t: PropTypes.func,
    locale: PropTypes.string,
    pipeline: PropTypes.object,
    columns: PropTypes.array,
};

BranchDetailsRow.contextTypes = {
    store: PropTypes.object,
    router: PropTypes.object.isRequired, // From react-router
    location: PropTypes.object,
};
