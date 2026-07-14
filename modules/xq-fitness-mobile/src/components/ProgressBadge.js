import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/common';

const ProgressBadge = ({ status, testID }) => {
  if (!status) {
    return (
      <View style={styles.containerNull} testID={testID}>
        <Text style={styles.textNull}>— first week</Text>
      </View>
    );
  }

  let text = '';
  let bgColor = '';
  let textColor = '';

  switch (status) {
    case 'INCREASED':
      text = '↑ Increased';
      bgColor = colors.successLight;
      textColor = '#16A34A'; // darker green for text
      break;
    case 'DECREASED':
      text = '↓ Decreased';
      bgColor = colors.dangerLight;
      textColor = '#DC2626'; // darker red for text
      break;
    case 'MAINTAINED':
      text = '= Same';
      bgColor = colors.neutralLight;
      textColor = colors.textSecondary;
      break;
    default:
      return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]} testID={testID}>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
  containerNull: {
    alignSelf: 'flex-start',
  },
  textNull: {
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});

export default ProgressBadge;
