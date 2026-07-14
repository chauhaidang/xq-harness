import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressBadge from '../../src/components/ProgressBadge';
import { colors } from '../../src/styles/common';

describe('ProgressBadge', () => {
  it('renders correctly for INCREASED status', () => {
    const { getByText } = render(<ProgressBadge status="INCREASED" />);
    const badge = getByText('↑ Increased');
    expect(badge).toBeTruthy();
    expect(badge.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#16A34A' })])
    );
  });

  it('renders correctly for DECREASED status', () => {
    const { getByText } = render(<ProgressBadge status="DECREASED" />);
    const badge = getByText('↓ Decreased');
    expect(badge).toBeTruthy();
    expect(badge.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#DC2626' })])
    );
  });

  it('renders correctly for MAINTAINED status', () => {
    const { getByText } = render(<ProgressBadge status="MAINTAINED" />);
    const badge = getByText('= Same');
    expect(badge).toBeTruthy();
    expect(badge.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.textSecondary })])
    );
  });

  it('renders correctly for null status (first week)', () => {
    const { getByText } = render(<ProgressBadge status={null} />);
    const badge = getByText('— first week');
    expect(badge).toBeTruthy();
    expect(badge.props.style).toEqual(
      expect.objectContaining({ color: colors.textSecondary })
    );
  });

  it('returns null for an invalid status', () => {
    const { toJSON } = render(<ProgressBadge status="INVALID_STATUS" />);
    expect(toJSON()).toBeNull();
  });
});
