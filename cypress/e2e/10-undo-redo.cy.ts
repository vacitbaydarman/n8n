import { CODE_NODE_NAME, SET_NODE_NAME, EDIT_FIELDS_SET_NODE_NAME } from './../constants';
import { SCHEDULE_TRIGGER_NODE_NAME } from '../constants';
import { WorkflowPage as WorkflowPageClass } from '../pages/workflow';
import { NDV } from '../pages/ndv';

// Suite-specific constants
const CODE_NODE_NEW_NAME = 'Something else';

const WorkflowPage = new WorkflowPageClass();
const ndv = new NDV();

describe('Undo/Redo', () => {
	beforeEach(() => {
		WorkflowPage.actions.visit();
	});

	it('should undo/redo adding nodes', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 0);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
	});

	it('should undo/redo adding connected nodes', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
	});

	it('should undo/redo adding node in the middle', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.addNodeBetweenNodes(
			SCHEDULE_TRIGGER_NODE_NAME,
			CODE_NODE_NAME,
			SET_NODE_NAME,
		);
		WorkflowPage.actions.zoomToFit();
		WorkflowPage.getters
			.canvasNodeByName('Code')
			.should('have.css', 'left', '860px')
			.should('have.css', 'top', '220px');

		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 3);
		WorkflowPage.getters.nodeConnections().should('have.length', 2);
		// Last node should be added back to original position
		WorkflowPage.getters
			.canvasNodeByName('Code')
			.should('have.css', 'left', '860px')
			.should('have.css', 'top', '220px');
	});

	it('should undo/redo deleting node using context menu', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.deleteNodeFromContextMenu(CODE_NODE_NAME);
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
	});

	it('should undo/redo deleting node using keyboard shortcut', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NAME).click();
		cy.get('body').type('{backspace}');
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 1);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
	});

	it('should undo/redo deleting node between two connected nodes', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(SET_NODE_NAME);
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NAME).click();
		WorkflowPage.actions.zoomToFit();
		cy.get('body').type('{backspace}');
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 3);
		WorkflowPage.getters.nodeConnections().should('have.length', 2);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
	});

	it('should undo/redo deleting whole workflow', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		cy.get('body').type('{esc}');
		cy.get('body').type('{esc}');
		WorkflowPage.actions.selectAll();
		cy.get('body').type('{backspace}');
		WorkflowPage.getters.canvasNodes().should('have.have.length', 0);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.have.length', 0);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
	});

	it('should undo/redo moving nodes', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		cy.drag('[data-test-id="canvas-node"].jtk-drag-selected', [50, 150], { clickToFinish: true });
		WorkflowPage.getters
			.canvasNodeByName('Code')
			.should('have.css', 'left', '740px')
			.should('have.css', 'top', '320px');

		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters
			.canvasNodeByName('Code')
			.should('have.css', 'left', '640px')
			.should('have.css', 'top', '220px');
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters
			.canvasNodeByName('Code')
			.should('have.css', 'left', '740px')
			.should('have.css', 'top', '320px');
	});

	it('should undo/redo deleting a connection using context menu', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.getters.nodeConnections().realHover();
		cy.get('.connection-actions .delete')
			.filter(':visible')
			.should('be.visible')
			.click({ force: true });
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
	});

	it('should undo/redo deleting a connection by moving it away', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		cy.drag('.rect-input-endpoint.jtk-endpoint-connected', [0, -100]);
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.nodeConnections().should('have.length', 0);
	});

	it('should undo/redo disabling a node using context menu', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.disableNode(CODE_NODE_NAME);
		WorkflowPage.getters.disabledNodes().should('have.length', 1);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.disabledNodes().should('have.length', 0);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.disabledNodes().should('have.length', 1);
	});

	it('should undo/redo disabling a node using keyboard shortcut', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.getters.canvasNodes().last().click();
		WorkflowPage.actions.hitDisableNodeShortcut();
		WorkflowPage.getters.disabledNodes().should('have.length', 1);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.disabledNodes().should('have.length', 0);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.disabledNodes().should('have.length', 1);
	});

	it('should undo/redo disabling multiple nodes', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		cy.get('body').type('{esc}');
		cy.get('body').type('{esc}');
		WorkflowPage.actions.selectAll();
		WorkflowPage.actions.hitDisableNodeShortcut();
		WorkflowPage.getters.disabledNodes().should('have.length', 2);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.disabledNodes().should('have.length', 0);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.disabledNodes().should('have.length', 2);
	});

	it('should undo/redo renaming node using NDV', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.getters.canvasNodes().last().click();
		cy.get('body').type('{enter}');
		ndv.actions.rename(CODE_NODE_NEW_NAME);
		cy.get('body').type('{esc}');
		WorkflowPage.actions.hitUndo();
		cy.get('body').type('{esc}');
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NAME).should('exist');
		WorkflowPage.actions.hitRedo();
		cy.get('body').type('{esc}');
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NEW_NAME).should('exist');
	});

	it('should undo/redo renaming node using keyboard shortcut', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.getters.canvasNodes().last().click();
		cy.get('body').trigger('keydown', { key: 'F2' });
		cy.get('.rename-prompt').should('be.visible');
		cy.get('body').type(CODE_NODE_NEW_NAME);
		cy.get('body').type('{enter}');
		WorkflowPage.actions.hitUndo();
		cy.get('body').type('{esc}');
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NAME).should('exist');
		WorkflowPage.actions.hitRedo();
		cy.get('body').type('{esc}');
		WorkflowPage.getters.canvasNodeByName(CODE_NODE_NEW_NAME).should('exist');
	});

	it('should undo/redo duplicating a node', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.duplicateNode(CODE_NODE_NAME);
		WorkflowPage.actions.hitUndo();
		WorkflowPage.getters.canvasNodes().should('have.length', 2);
		WorkflowPage.actions.hitRedo();
		WorkflowPage.getters.canvasNodes().should('have.length', 3);
	});

	it('should undo/redo pasting nodes', () => {
		cy.fixture('Test_workflow-actions_paste-data.json').then((data) => {
			cy.get('body').paste(JSON.stringify(data));
			WorkflowPage.actions.zoomToFit();
			WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
			WorkflowPage.actions.hitUndo();
			WorkflowPage.getters.canvasNodes().should('have.have.length', 0);
			WorkflowPage.actions.hitRedo();
			WorkflowPage.getters.canvasNodes().should('have.have.length', 2);
		});
	});

	it('should undo/redo multiple steps', () => {
		WorkflowPage.actions.addNodeToCanvas(SCHEDULE_TRIGGER_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		// WorkflowPage.actions.addNodeToCanvas(SET_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(EDIT_FIELDS_SET_NODE_NAME);
		WorkflowPage.actions.addNodeToCanvas(CODE_NODE_NAME);
		WorkflowPage.actions.zoomToFit();

		// Disable last node
		WorkflowPage.getters.canvasNodes().last().click();
		WorkflowPage.actions.hitDisableNodeShortcut();

		// Move first one
		WorkflowPage.actions
			.getNodePosition(WorkflowPage.getters.canvasNodes().first())
			.then((initialPosition) => {
				WorkflowPage.getters.canvasNodes().first().click();
				cy.drag('[data-test-id="canvas-node"].jtk-drag-selected', [50, 150], {
					clickToFinish: true,
				});
				WorkflowPage.getters
					.canvasNodes()
					.first()
					.should('have.css', 'left', `${initialPosition.left + 120}px`)
					.should('have.css', 'top', `${initialPosition.top + 140}px`);

				// Delete the set node
				WorkflowPage.getters.canvasNodeByName(EDIT_FIELDS_SET_NODE_NAME).click().click();
				cy.get('body').type('{backspace}');

				// First undo: Should return deleted node
				WorkflowPage.actions.hitUndo();
				WorkflowPage.getters.canvasNodes().should('have.length', 4);
				WorkflowPage.getters.nodeConnections().should('have.length', 3);
				// Second undo: Should move first node to it's original position
				WorkflowPage.actions.hitUndo();
				WorkflowPage.getters
					.canvasNodes()
					.first()
					.should('have.css', 'left', `${initialPosition.left}px`)
					.should('have.css', 'top', `${initialPosition.top}px`);
				// Third undo: Should enable last node
				WorkflowPage.actions.hitUndo();
				WorkflowPage.getters.disabledNodes().should('have.length', 0);

				// First redo: Should disable last node
				WorkflowPage.actions.hitRedo();
				WorkflowPage.getters.disabledNodes().should('have.length', 1);
				// Second redo: Should move the first node
				WorkflowPage.actions.hitRedo();
				WorkflowPage.getters
					.canvasNodes()
					.first()
					.should('have.css', 'left', `${initialPosition.left + 120}px`)
					.should('have.css', 'top', `${initialPosition.top + 140}px`);
				// Third redo: Should delete the Set node
				WorkflowPage.actions.hitRedo();
				WorkflowPage.getters.canvasNodes().should('have.length', 3);
				WorkflowPage.getters.nodeConnections().should('have.length', 2);
			});
	});

	it('should be able to copy and paste pinned data nodes in workflows with dynamic Switch node', () => {
		cy.fixture('Test_workflow_form_switch.json').then((data) => {
			cy.get('body').paste(JSON.stringify(data));
		});
		WorkflowPage.actions.zoomToFit();

		WorkflowPage.getters.canvasNodes().should('have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		cy.get(WorkflowPage.getters.getEndpointSelector('input', 'Switch')).should('have.length', 1);
		cy.get(WorkflowPage.getters.getEndpointSelector('input', 'Switch'))
					.should('have.css', 'left', `637px`)
					.should('have.css', 'top', `501px`);

		cy.fixture('Test_workflow_form_switch.json').then((data) => {
			cy.get('body').paste(JSON.stringify(data));
		});
		WorkflowPage.getters.canvasNodes().should('have.length', 4);
		WorkflowPage.getters.nodeConnections().should('have.length', 2);

		WorkflowPage.actions.hitUndo();

		WorkflowPage.getters.canvasNodes().should('have.length', 2);
		WorkflowPage.getters.nodeConnections().should('have.length', 1);
		cy.get(WorkflowPage.getters.getEndpointSelector('input', 'Switch')).should('have.length', 1);
		cy.get(WorkflowPage.getters.getEndpointSelector('input', 'Switch'))
					.should('have.css', 'left', `637px`)
					.should('have.css', 'top', `501px`);
	});
});
